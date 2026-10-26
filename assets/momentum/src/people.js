// The people of the street, built from simple rounded shapes in real metres:
//  - createCyclist(): a black roadster bicycle (with a carrier over the back wheel, as on Bangladesh's roads) and its
//    rider in a white shirt. Origin on the ground under the front of the front tyre, +x forward, +y up. roll(m)
//    turns the wheels and the pedals (the rider's legs follow the pedals); jolt(k) throws the rider forward a little
//    (0…1), as when the bicycle hits something.
//  - createRunner(): a runner in mid-stride (for the test). Origin on the ground under the hips, +x forward.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BIKE = { wheel: 0.35, front: -0.35, rear: -1.4, length: 1.75, crank: 0.17, gear: 2.4, head: 1.87 };

const Y = new THREE.Vector3(0, 1, 0);
const mat = (name, color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });

/** A capsule between two points (a stick for limbs and tubes): place(a, b) puts it there. */
function stick(r, len, m, name, capped = true) {
  const geo = capped ? new THREE.CapsuleGeometry(r, Math.max(0.001, len), 3, 10) : new THREE.CylinderGeometry(r, r, len, 10);
  const mesh = new THREE.Mesh(geo, m);
  mesh.name = name;
  const d = new THREE.Vector3();
  return {
    mesh,
    place(a, b) {
      mesh.position.addVectors(a, b).multiplyScalar(0.5);
      d.subVectors(b, a);
      const n = d.length();
      if (n < 1e-9) return;
      mesh.quaternion.setFromUnitVectors(Y, d.divideScalar(n));
      if (!capped) mesh.scale.y = n / len;
    },
  };
}

/**
 * The middle joint of a two-part limb from `a` toward `c` (lengths l1, l2), bending toward `pole`; `end` gets where
 * the limb really ends (c, or as near as it reaches). Returns the middle joint in `out`.
 */
function solve(a, c, l1, l2, pole, out, end) {
  const dir = new THREE.Vector3().subVectors(c, a);
  const dist = THREE.MathUtils.clamp(dir.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  dir.normalize();
  const x = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const perp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  out.copy(a).addScaledVector(dir, x).addScaledVector(perp, h);
  end.copy(a).addScaledVector(dir, dist);
  return out;
}

function personMaterials({ shirt = '#f1f3f5', trousers = '#2c3a5a', shoe = '#1f1f22' } = {}) {
  return {
    skin: mat('Skin', '#b27b50', 0.6),
    hair: mat('Hair', '#1c1a19', 0.55),
    shirt: mat('Shirt', shirt, 0.8),
    trousers: mat('Trousers', trousers, 0.8),
    shoe: mat('Shoe', shoe, 0.5),
  };
}

/** A head with hair, eyes and a nose, facing +x. */
function head(M, r = 0.11) {
  const g = new THREE.Group();
  g.name = 'Head';
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), M.skin));
  const hair = new THREE.Mesh(new THREE.SphereGeometry(r + 0.008, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), M.hair);
  hair.rotation.z = 0.55;
  hair.position.x = -0.008;
  g.add(hair);
  for (const z of [-0.035, 0.035]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), M.hair);
    eye.position.set(r * 0.9, 0.012, z);
    g.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), M.skin);
  nose.position.set(r * 0.98, -0.018, 0);
  g.add(nose);
  return g;
}

export function createCyclist({ name = 'Cyclist' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const B = {
    frame: mat('BikeFrame', '#262a30', 0.35, 0.4),
    chrome: mat('Chrome', '#cfd5db', 0.22, 0.9),
    tyre: mat('Tyre', '#1f2226', 0.85),
    saddle: mat('Saddle', '#5a3a24', 0.6),
  };
  const P = personMaterials();
  const v3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);

  // ── the bicycle ──
  const FA = v3(BIKE.front, BIKE.wheel);
  const RA = v3(BIKE.rear, BIKE.wheel);
  const BB = v3(-0.97, 0.3);
  const ST = v3(-1.12, 0.86);
  const HT = v3(-0.48, 0.9);
  const HB = v3(-0.44, 0.74);
  const tube = (a, b, r, m, nm) => {
    const s = stick(r, a.distanceTo(b), m, nm, false);
    s.place(a, b);
    root.add(s.mesh);
  };
  tube(ST, HT, 0.019, B.frame, 'TopTube');
  tube(BB, HB, 0.021, B.frame, 'DownTube');
  tube(BB, ST, 0.019, B.frame, 'SeatTube');
  tube(HB, HT, 0.024, B.frame, 'HeadTube');
  for (const z of [-0.06, 0.06]) {
    tube(v3(BB.x, BB.y, z * 0.6), v3(RA.x, RA.y, z), 0.012, B.frame, 'ChainStay');
    tube(v3(ST.x, ST.y, z * 0.4), v3(RA.x, RA.y, z), 0.011, B.frame, 'SeatStay');
    tube(v3(HB.x, HB.y, z * 0.7), v3(FA.x, FA.y, z), 0.013, B.chrome, 'Fork');
  }
  const SEAT = v3(-1.15, 1.0);
  tube(ST, SEAT, 0.013, B.chrome, 'SeatPost');
  const saddle = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.06, 0.16, 2, 0.025), B.saddle);
  saddle.position.set(SEAT.x - 0.01, SEAT.y + 0.03, 0);
  saddle.name = 'Saddle';
  root.add(saddle);
  const STEM = v3(-0.5, 1.05);
  tube(HT, STEM, 0.013, B.chrome, 'Stem');
  const GRIP = [v3(-0.58, 1.04, -0.3), v3(-0.58, 1.04, 0.3)];
  tube(v3(STEM.x, STEM.y, -0.24), v3(STEM.x, STEM.y, 0.24), 0.012, B.chrome, 'Handlebar');
  for (const g of GRIP) {
    tube(v3(STEM.x, STEM.y, g.z * 0.8), g, 0.012, B.chrome, 'Handlebar');
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8).rotateX(Math.PI / 2), B.tyre);
    grip.position.copy(g);
    root.add(grip);
  }
  // the carrier over the back wheel, with its struts
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.16), B.chrome);
  rack.position.set(-1.45, 0.82, 0);
  rack.name = 'Carrier';
  root.add(rack);
  for (const z of [-0.07, 0.07]) tube(v3(-1.66, 0.81, z), v3(RA.x, RA.y, z), 0.008, B.chrome, 'CarrierStrut');
  // mudguards
  for (const [c, a0] of [
    [FA, 0.3],
    [RA, 1.4],
  ]) {
    const g = new THREE.Mesh(new THREE.TorusGeometry(BIKE.wheel + 0.03, 0.028, 4, 20, 1.6), B.frame);
    g.position.copy(c);
    g.rotation.z = a0;
    g.scale.z = 1.6;
    g.name = 'Mudguard';
    root.add(g);
  }
  // wheels: tyre, rim, hub and spokes (they turn)
  const wheels = [FA, RA].map((c) => {
    const w = new THREE.Group();
    w.name = 'Wheel';
    w.position.copy(c);
    w.add(new THREE.Mesh(new THREE.TorusGeometry(BIKE.wheel - 0.022, 0.022, 8, 32), B.tyre));
    w.add(new THREE.Mesh(new THREE.TorusGeometry(BIKE.wheel - 0.05, 0.009, 4, 32), B.chrome));
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10).rotateX(Math.PI / 2), B.chrome));
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const side = i % 2 ? 0.035 : -0.035;
      pts.push(0, 0, side, Math.cos(a) * (BIKE.wheel - 0.055), Math.sin(a) * (BIKE.wheel - 0.055), 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const spokes = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ name: 'Spokes', color: '#8f98a3' }));
    spokes.name = 'Spokes';
    w.add(spokes);
    root.add(w);
    return w;
  });
  // chainring and cranks with pedals (they turn)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 24), B.chrome);
  ring.position.set(BB.x, BB.y, 0.06);
  ring.name = 'Chainring';
  root.add(ring);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 4, 30), mat('Chain', '#55595f', 0.5, 0.6));
  chain.scale.set(0.24, 0.07, 1);
  chain.position.set((BB.x + RA.x) / 2, (BB.y + RA.y) / 2 + 0.01, 0.06);
  chain.rotation.z = Math.atan2(RA.y - BB.y, RA.x - BB.x);
  chain.name = 'Chain';
  root.add(chain);
  const crankGeo = new THREE.BoxGeometry(BIKE.crank, 0.022, 0.016).translate(BIKE.crank / 2, 0, 0);
  const pedalGeo = new THREE.BoxGeometry(0.1, 0.022, 0.09);
  const cranks = [0.09, -0.09].map((z) => {
    const c = new THREE.Mesh(crankGeo, B.chrome);
    c.position.set(BB.x, BB.y, z);
    c.name = 'Crank';
    const p = new THREE.Mesh(pedalGeo, B.tyre);
    p.name = 'Pedal';
    root.add(c, p);
    return { c, p, z: z * 1.45 };
  });

  // ── the rider ──
  const rider = new THREE.Group();
  rider.name = 'Rider';
  root.add(rider);
  const HIP = v3(-1.12, 1.07);
  const SEG = { thigh: 0.45, shin: 0.45, upper: 0.31, fore: 0.3, torso: 0.56 };
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, SEG.torso - 0.24, 4, 12), P.shirt);
  torso.scale.set(0.8, 1, 1.25);
  torso.name = 'Torso';
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.14, 4, 10).rotateX(Math.PI / 2), P.trousers);
  hips.position.copy(HIP);
  hips.name = 'Hips';
  const neck = stick(0.045, 0.08, P.skin, 'Neck');
  const hd = head(P);
  rider.add(torso, hips, neck.mesh, hd);
  const legs = [1, -1].map((s) => {
    const thigh = stick(0.066, SEG.thigh, P.trousers, 'Thigh');
    const shin = stick(0.055, SEG.shin, P.trousers, 'Shin');
    const shoe = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.08, 0.1, 2, 0.03), P.shoe);
    shoe.name = 'Shoe';
    rider.add(thigh.mesh, shin.mesh, shoe);
    return { thigh, shin, shoe, z: s * 0.1 };
  });
  const arms = [1, -1].map((s) => {
    const upper = stick(0.047, SEG.upper, P.shirt, 'UpperArm');
    const fore = stick(0.037, SEG.fore - 0.04, P.skin, 'Forearm');
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), P.skin);
    hand.name = 'Hand';
    rider.add(upper.mesh, fore.mesh, hand);
    return { upper, fore, hand, s };
  });

  // a big invisible box round bicycle and rider: a tap anywhere on them works
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 1.4), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-0.85, 1.0, 0);
  hit.userData.noExport = true;
  hit.name = 'CyclistHit';
  root.add(hit);

  const tmp = { a: v3(0, 0), b: v3(0, 0), c: v3(0, 0), d: v3(0, 0), e: v3(0, 0) };
  const FWD = v3(1, 0.15, 0).normalize();
  let crankAngle = 0.6;
  let lean = 0;

  function pose() {
    // the trunk leans 30° forward, more in a jolt
    const a = 0.52 + lean * 0.45;
    const shoulder = v3(HIP.x + Math.sin(a) * SEG.torso, HIP.y + Math.cos(a) * SEG.torso);
    torso.position.lerpVectors(HIP, shoulder, 0.5);
    torso.rotation.set(0, 0, -a);
    const nb = v3(shoulder.x + Math.sin(a) * 0.04, shoulder.y + Math.cos(a) * 0.04);
    const nt = v3(shoulder.x + Math.sin(a * 0.6) * 0.12, shoulder.y + Math.cos(a * 0.6) * 0.12);
    neck.place(nb, nt);
    hd.position.set(nt.x + 0.03, nt.y + 0.1, 0);
    hd.rotation.z = -lean * 0.3;
    // legs on the pedals: each foot on its pedal, the knees bend forward
    cranks.forEach((k, i) => {
      const ang = crankAngle + i * Math.PI;
      k.c.rotation.z = ang;
      const px = BB.x + Math.cos(ang) * BIKE.crank;
      const py = BB.y + Math.sin(ang) * BIKE.crank;
      k.p.position.set(px, py, k.z);
      const leg = legs[i];
      tmp.a.set(HIP.x, HIP.y, leg.z);
      tmp.c.set(px - 0.03, py + 0.07, k.z);
      solve(tmp.a, tmp.c, SEG.thigh, SEG.shin, FWD, tmp.b, tmp.d);
      leg.thigh.place(tmp.a, tmp.b);
      leg.shin.place(tmp.b, tmp.d);
      leg.shoe.position.set(px + 0.02, py + 0.035, k.z);
    });
    // arms to the grips, elbows bent down and out
    for (const arm of arms) {
      tmp.a.set(shoulder.x, shoulder.y - 0.04, arm.s * 0.19);
      tmp.c.copy(GRIP[arm.s > 0 ? 1 : 0]);
      tmp.e.set(-0.4, -1, arm.s * 0.4);
      solve(tmp.a, tmp.c, SEG.upper, SEG.fore, tmp.e, tmp.b, tmp.d);
      arm.upper.place(tmp.a, tmp.b);
      arm.fore.place(tmp.b, tmp.d);
      arm.hand.position.copy(tmp.d);
    }
  }
  pose();

  return {
    root,
    hit,
    /** Turn wheels and pedals for `distance` m of road. */
    roll(distance) {
      for (const w of wheels) w.rotation.z = -distance / BIKE.wheel;
      crankAngle = 0.6 - distance / BIKE.wheel / BIKE.gear;
      pose();
    },
    /** Throw the rider forward a little (0…1). */
    jolt(k) {
      lean = k;
      pose();
    },
  };
}

export function createRunner({ name = 'Runner' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const P = personMaterials({ shirt: '#b8323f', trousers: '#22303f', shoe: '#f2f2f2' });
  const v3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const at = (o, len, deg) => v3(o.x + Math.sin((deg * Math.PI) / 180) * len, o.y - Math.cos((deg * Math.PI) / 180) * len, o.z);
  const HIP = v3(0, 0.95);
  const lean = 12; // degrees forward
  const shoulder = v3(HIP.x + Math.sin((lean * Math.PI) / 180) * 0.52, HIP.y + Math.cos((lean * Math.PI) / 180) * 0.52);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 4, 12), P.shirt);
  torso.scale.set(0.8, 1, 1.25);
  torso.position.lerpVectors(HIP, shoulder, 0.5);
  torso.rotation.z = (-lean * Math.PI) / 180;
  torso.name = 'Torso';
  const shorts = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.14, 4, 10).rotateX(Math.PI / 2), P.trousers);
  shorts.position.copy(HIP);
  shorts.name = 'Shorts';
  const hd = head(P);
  hd.position.set(shoulder.x + 0.06, shoulder.y + 0.2, 0);
  const neck = stick(0.045, 0.08, P.skin, 'Neck');
  neck.place(v3(shoulder.x + 0.01, shoulder.y + 0.03), v3(shoulder.x + 0.04, shoulder.y + 0.11));
  root.add(torso, shorts, hd, neck.mesh);
  const limb = (a, b, r, m, nm) => {
    const s = stick(r, a.distanceTo(b), m, nm);
    s.place(a, b);
    root.add(s.mesh);
  };
  // legs: the front one reaching forward, the back one pushing off with the foot kicked up behind
  for (const [z, thighDeg, shinDeg] of [
    [0.09, -38, 12],
    [-0.09, 24, 70],
  ]) {
    const hip = v3(HIP.x, HIP.y, z);
    const knee = at(hip, 0.45, -thighDeg);
    const ankle = at(knee, 0.44, -shinDeg);
    limb(hip, knee, 0.06, P.skin, 'Thigh');
    limb(knee, ankle, 0.05, P.skin, 'Shin');
    const shoe = new THREE.Mesh(new RoundedBoxGeometry(0.25, 0.08, 0.1, 2, 0.03), P.shoe);
    shoe.position.set(ankle.x + 0.07, ankle.y - 0.03, z);
    shoe.rotation.z = (shinDeg > 40 ? 0.9 : 0) * 1;
    shoe.name = 'Shoe';
    root.add(shoe);
  }
  // arms swing against the legs, elbows bent
  for (const [z, upDeg, foreDeg] of [
    [-0.19, -40, -110],
    [0.19, 35, -40],
  ]) {
    const sh = v3(shoulder.x, shoulder.y - 0.04, z);
    const elbow = at(sh, 0.3, -upDeg);
    const hand = at(elbow, 0.27, -foreDeg);
    limb(sh, elbow, 0.045, P.shirt, 'UpperArm');
    limb(elbow, hand, 0.036, P.skin, 'Forearm');
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), P.skin);
    h.position.copy(hand);
    h.name = 'Hand';
    root.add(h);
  }
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.95, 0);
  hit.userData.noExport = true;
  hit.name = 'RunnerHit';
  root.add(hit);
  return { root, hit, length: 0.9 };
}
