// The cyclist of the book's example: a bicycle and its rider built from simple shapes, in real metres inside and
// drawn SCALE times bigger in the scene so that it can be seen on a 7 km road. roll(m) turns the wheels and the
// pedals for the road covered, and the legs follow the pedals. Local +z is forward, +y up.
import * as THREE from 'three';

/** How much bigger than real the cyclist is drawn. */
export const SCALE = 230;

const R = 0.34; // wheel radius, m
const HUB_Z = 0.52; // the hubs are this far behind and in front of the middle
const BB = new THREE.Vector3(0, 0.29, -0.02); // bottom bracket (the pedals turn round it)
const CRANK = 0.17;
const HIP_Y = 1.0;
const HIP_Z = -0.2;
const THIGH = 0.47;
const SHIN = 0.47;

export function createCyclist() {
  const root = new THREE.Group();
  root.name = 'Cyclist';
  const bike = new THREE.Group();
  bike.scale.setScalar(SCALE);
  root.add(bike);

  const mat = (name, color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
  const M = {
    frame: mat('Frame', '#a61e4d', 0.45, 0.25),
    tyre: mat('Tyre', '#25282d', 0.85),
    steel: mat('Steel', '#c9ced4', 0.35, 0.8),
    saddle: mat('Saddle', '#2b2f36', 0.7),
    shirt: mat('Shirt', '#f4f5f7', 0.85),
    trousers: mat('Trousers', '#3a4a5e', 0.85),
    skin: mat('Skin', '#b27b50', 0.75),
    hair: mat('Hair', '#1f1f22', 0.8),
  };
  const unitTube = new THREE.CylinderGeometry(1, 1, 1, 8);
  const Y = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();
  /** Put a unit tube between a and b, radius r. */
  function place(mesh, a, b, r) {
    tmp.subVectors(b, a);
    const len = tmp.length();
    mesh.position.addVectors(a, b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(Y, tmp.divideScalar(len || 1));
    mesh.scale.set(r, len, r);
    return mesh;
  }
  const tube = (a, b, r, m, parent = bike) => {
    const mesh = place(new THREE.Mesh(unitTube, m), a, b, r);
    parent.add(mesh);
    return mesh;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // wheels: tyre, rim, three spokes across, hub; each spins about x
  const wheels = [-HUB_Z, HUB_Z].map((z) => {
    const w = new THREE.Group();
    w.position.set(0, R, z);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(R - 0.025, 0.028, 6, 28), M.tyre);
    tyre.rotation.y = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.06, 0.012, 4, 28), M.steel);
    rim.rotation.y = Math.PI / 2;
    w.add(tyre, rim);
    for (let k = 0; k < 3; k++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.012, 2 * (R - 0.06), 0.012), M.steel);
      spoke.rotation.x = (k * Math.PI) / 3;
      w.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), M.steel);
    hub.rotation.z = Math.PI / 2;
    w.add(hub);
    bike.add(w);
    return w;
  });

  // the frame (a classic diamond frame), fork, handlebar and saddle
  const seatTop = V(0, 0.88, -0.19);
  const headTop = V(0, 0.93, 0.36);
  const headLow = V(0, 0.74, 0.41);
  tube(BB, seatTop, 0.022, M.frame);
  tube(BB, headLow, 0.026, M.frame);
  tube(V(0, 0.85, -0.18), V(0, 0.9, 0.37), 0.022, M.frame);
  tube(headLow, headTop, 0.028, M.frame);
  tube(V(0.035, BB.y, BB.z), V(0.05, R, -HUB_Z), 0.014, M.frame);
  tube(V(-0.035, BB.y, BB.z), V(-0.05, R, -HUB_Z), 0.014, M.frame);
  tube(V(0.03, 0.84, -0.18), V(0.05, R, -HUB_Z), 0.012, M.frame);
  tube(V(-0.03, 0.84, -0.18), V(-0.05, R, -HUB_Z), 0.012, M.frame);
  tube(V(0.04, headLow.y, headLow.z), V(0.05, R, HUB_Z), 0.014, M.frame);
  tube(V(-0.04, headLow.y, headLow.z), V(-0.05, R, HUB_Z), 0.014, M.frame);
  tube(headTop, V(0, 1.02, 0.31), 0.016, M.steel);
  tube(V(-0.25, 1.02, 0.3), V(0.25, 1.02, 0.3), 0.014, M.steel);
  tube(V(0, 0.84, -0.18), V(0, 0.96, -0.22), 0.014, M.steel);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.25), M.saddle);
  saddle.position.set(0, 0.98, -0.21);
  bike.add(saddle);

  // the pedals, round the bottom bracket
  const crank = new THREE.Group();
  crank.position.copy(BB);
  for (const side of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, CRANK, 0.03), M.steel);
    arm.position.set(side * 0.075, (-side * CRANK) / 2, 0);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.06), M.saddle);
    pedal.position.set(side * 0.11, -side * CRANK, 0);
    crank.add(arm, pedal);
  }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16), M.steel);
  ring.rotation.z = Math.PI / 2;
  ring.position.x = 0.05;
  crank.add(ring);
  bike.add(crank);

  // the rider: torso leaning forward, arms to the handlebar, legs on the pedals
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.34, 4, 10), M.shirt);
  place(torso, V(0, 1.06, -0.19), V(0, 1.44, 0.02), 1);
  torso.scale.set(1, 1, 0.8);
  bike.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M.skin);
  head.position.set(0, 1.62, 0.09);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.106, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair);
  hair.position.set(0, 1.635, 0.075);
  hair.rotation.x = -0.35;
  bike.add(head, hair);
  for (const side of [1, -1]) {
    const shoulder = V(side * 0.17, 1.42, 0.01);
    const elbow = V(side * 0.21, 1.22, 0.16);
    const hand = V(side * 0.22, 1.03, 0.3);
    tube(shoulder, elbow, 0.045, M.shirt);
    tube(elbow, hand, 0.036, M.skin);
  }
  const legs = [1, -1].map((side) => ({
    side,
    thigh: tube(V(0, 1, 0), V(0, 0, 0), 0.062, M.trousers),
    shin: tube(V(0, 1, 0), V(0, 0, 0), 0.048, M.trousers),
    foot: (() => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.2), M.saddle);
      bike.add(f);
      return f;
    })(),
  }));

  const hip = new THREE.Vector3();
  const knee = new THREE.Vector3();
  const foot = new THREE.Vector3();
  /** The legs follow the pedals (two-bone reach in the side view, the knee forward). */
  function pose(phi) {
    for (const leg of legs) {
      const a = phi + (leg.side > 0 ? 0 : Math.PI);
      foot.set(leg.side * 0.11, BB.y - CRANK * Math.cos(a) + 0.035, BB.z - CRANK * Math.sin(a));
      hip.set(leg.side * 0.1, HIP_Y, HIP_Z);
      const dy = foot.y - hip.y;
      const dz = foot.z - hip.z;
      const d = Math.min(Math.hypot(dy, dz), THIGH + SHIN - 1e-3);
      const along = (THIGH * THIGH - SHIN * SHIN + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(0, THIGH * THIGH - along * along));
      const uy = dy / d;
      const uz = dz / d;
      knee.set(leg.side * 0.11, hip.y + uy * along + uz * h, hip.z + uz * along - uy * h);
      place(leg.thigh, hip, knee, 0.062);
      place(leg.shin, knee, foot, 0.048);
      leg.foot.position.set(foot.x, foot.y - 0.01, foot.z + 0.03);
    }
  }

  /** Turn the wheels and pedals for m metres of scene road ridden so far (always forward for the rider). */
  function roll(m) {
    const turn = m / (R * SCALE);
    for (const w of wheels) w.rotation.x = turn;
    crank.rotation.x = turn / 2.4 + 0.5;
    pose(crank.rotation.x);
  }
  roll(0);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  // a soft dark patch under the wheels: seen from above, a bicycle is thin, and this keeps it standing on the road
  const blur = document.createElement('canvas');
  blur.width = blur.height = 64;
  const g = blur.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(20, 28, 38, 0.5)');
  grad.addColorStop(0.6, 'rgba(20, 28, 38, 0.28)');
  grad.addColorStop(1, 'rgba(20, 28, 38, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blur), transparent: true, depthWrite: false, toneMapped: false }),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = 0.015;
  shade.userData.noExport = true;
  bike.add(shade);

  // a generous invisible target, so a finger finds the cyclist easily
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.7, 0);
  hit.userData.noExport = true;
  bike.add(hit);

  return { root, hit, roll };
}
