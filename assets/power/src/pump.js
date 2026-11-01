// An electric water pump of the kind on every Bangladeshi house (a monoblock centrifugal pump), procedural three.js,
// in metres: a painted motor with cooling fins, a slotted fan cover at the back, a terminal box with its capacitor and
// a green lamp on top, the pump head (a cast volute with a bolted front cover) at the front, the suction port facing
// forward (+x) and the delivery port pointing up; feet on a steel base plate, bolted to a small concrete plinth.
// `size` scales the motor, so the bigger pump is visibly bigger. While it runs, the shaft collar between motor and
// head spins, the lamp glows and the body hums (a tiny shake).
// The group's origin is on the ground under the delivery port; `outlet` and `inlet` are the ports' ends (local),
// `cableIn` the terminal box's cable gland (on the side `cableSide`, -1 = local -z).
import * as THREE from 'three';
import { bake } from './build.js';

const PLINTH_H = 0.1;
const SHARED = new Map(); // the materials both pumps share after baking (cast iron, steel, …)
let common = null;

/** A dark slotted grille texture for the fan cover. */
function grilleTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3d4247';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#121416';
  for (let i = 0; i < 9; i++) ctx.fillRect(12 + i * 12, 14, 6, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A small silver rating plate with a few lines (no brand, no numbers). */
function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#dfe3e6';
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = '#7d858c';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 122, 58);
  ctx.fillStyle = '#5b636b';
  for (const [y, w] of [
    [14, 70],
    [26, 96],
    [36, 84],
    [46, 60],
  ])
    ctx.fillRect(12, y, w, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {{ color: string, size?: number, name?: string }} opts
 */
export function createPump({ color, size = 1, name = 'Pump', cableSide = -1 }) {
  const root = new THREE.Group();
  root.name = name;
  const body = new THREE.Group(); // shakes while running
  root.add(body);

  const paint = new THREE.MeshStandardMaterial({ name: 'Paint', color, metalness: 0.35, roughness: 0.38 });
  // made once for both pumps (and their two textures drawn once)
  common ||= {
    castIron: new THREE.MeshStandardMaterial({ name: 'CastIron', color: '#5a6066', metalness: 0.55, roughness: 0.5 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: '#b9c0c6', metalness: 0.85, roughness: 0.28 }),
    dark: new THREE.MeshStandardMaterial({ name: 'Dark', color: '#2b2f33', metalness: 0.4, roughness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: '#c99a3c', metalness: 0.9, roughness: 0.3 }),
    concrete: new THREE.MeshStandardMaterial({ name: 'Plinth', color: '#b9b2a6', roughness: 0.95 }),
    grille: new THREE.MeshStandardMaterial({ name: 'FanCover', map: grilleTexture(), metalness: 0.3, roughness: 0.6 }),
    plate: new THREE.MeshStandardMaterial({ name: 'RatingPlate', map: plateTexture(), metalness: 0.6, roughness: 0.35 }),
  };
  const { castIron, steel, dark, brass, concrete, grille, plate } = common;
  const lampOff = new THREE.MeshStandardMaterial({ color: '#2f5a33', roughness: 0.3 });
  const lamp = new THREE.MeshStandardMaterial({ color: '#2f5a33', emissive: '#000000', roughness: 0.3 });

  const R = 0.072 * size; // motor radius
  const LEN = 0.2 * size; // motor length
  const HR = 0.088 * size; // pump head radius
  const HL = 0.085 * size; // pump head length
  const AXIS = PLINTH_H + 0.016 + 0.035 * size + R; // the shaft's height above the ground
  const X = (v) => new THREE.Mesh(v, paint);
  const alongX = (g) => g.rotateZ(Math.PI / 2);

  // the plinth and the base plate (in the body: its hum is far under a millimetre)
  const plinthL = LEN + HL + 0.26 * size;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(plinthL, PLINTH_H, 0.32 * size + 0.08), concrete);
  plinth.position.set(-plinthL / 2 + HL + 0.08, PLINTH_H / 2, 0);
  body.add(plinth);
  const stand = [plinth]; // left out of the box the action's ring goes round
  const base = new THREE.Mesh(new THREE.BoxGeometry(LEN + HL + 0.08, 0.016, 0.2 * size), dark);
  base.position.set(-(LEN + HL) / 2 + HL / 2 + 0.01, PLINTH_H + 0.008, 0);
  body.add(base);
  stand.push(base);
  for (const bx of [base.position.x - (LEN + HL) / 2 + 0.01, base.position.x + (LEN + HL) / 2 - 0.01])
    for (const bz of [-0.075 * size, 0.075 * size]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6), steel);
      bolt.position.set(bx, PLINTH_H + 0.022, bz);
      body.add(bolt);
      stand.push(bolt);
    }

  // the motor: body, fins, end bells, fan cover
  const mx = -HL / 2 - 0.02 * size - LEN / 2; // the motor's centre
  const motor = X(alongX(new THREE.CylinderGeometry(R, R, LEN, 40)));
  motor.position.set(mx, AXIS, 0);
  body.add(motor);
  const FINS = 18;
  const finGeo = new THREE.BoxGeometry(LEN * 0.86, 0.016 * size, 0.005 * size);
  for (let i = 0; i < FINS; i++) {
    const a = (i / FINS) * Math.PI * 2;
    if (Math.abs(Math.sin(a) - 1) < 0.08) continue; // none under the terminal box
    const fin = new THREE.Mesh(finGeo, paint);
    fin.position.set(mx, AXIS + Math.sin(a) * (R + 0.006 * size), Math.cos(a) * (R + 0.006 * size));
    fin.rotation.x = Math.PI / 2 - a; // its 16 mm side points out from the axis
    body.add(fin);
  }
  for (const side of [-1, 1]) {
    const bell = new THREE.Mesh(alongX(new THREE.CylinderGeometry(R * 0.96, R * 1.02, 0.025 * size, 40)), castIron);
    bell.position.set(mx + side * (LEN / 2 + 0.012 * size), AXIS, 0);
    body.add(bell);
  }
  const cover = new THREE.Mesh(alongX(new THREE.CylinderGeometry(R * 0.92, R * 0.92, 0.07 * size, 40, 1, true)), grille);
  cover.position.set(mx - LEN / 2 - 0.06 * size, AXIS, 0);
  body.add(cover);
  const coverEnd = new THREE.Mesh(alongX(new THREE.CircleGeometry(R * 0.92, 40)), dark);
  coverEnd.rotation.set(0, -Math.PI / 2, 0);
  coverEnd.position.set(mx - LEN / 2 - 0.095 * size, AXIS, 0);
  body.add(coverEnd);
  // feet
  for (const fx of [mx - LEN * 0.32, mx + LEN * 0.32]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.04 * size, 0.035 * size + 0.02, 0.17 * size), castIron);
    foot.position.set(fx, PLINTH_H + 0.016 + (0.035 * size + 0.02) / 2 - 0.01, 0);
    body.add(foot);
  }
  // the terminal box with the capacitor and the lamp
  const box = X(new THREE.BoxGeometry(0.085 * size, 0.05 * size, 0.08 * size));
  box.position.set(mx + LEN * 0.08, AXIS + R + 0.022 * size, 0);
  body.add(box);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.09 * size, 0.008, 0.085 * size), dark);
  lid.position.set(box.position.x, box.position.y + 0.028 * size, 0);
  body.add(lid);
  const cap = new THREE.Mesh(alongX(new THREE.CylinderGeometry(0.018 * size, 0.018 * size, 0.07 * size, 20)), steel);
  cap.position.set(mx - LEN * 0.25, AXIS + R + 0.02 * size, 0.02 * size);
  body.add(cap);
  const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.009 * size + 0.003, 14, 10), lamp);
  lampMesh.position.set(box.position.x + 0.025 * size, lid.position.y + 0.006, 0.02 * size);
  body.add(lampMesh);
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.025, 10), dark);
  gland.rotation.x = Math.PI / 2;
  gland.position.set(box.position.x - 0.02 * size, box.position.y, cableSide * 0.05 * size);
  body.add(gland);
  const nameplate = new THREE.Mesh(new THREE.PlaneGeometry(0.085 * size, 0.042 * size), plate);
  nameplate.position.set(mx - LEN * 0.05, AXIS + 0.005, R + 0.0165 * size);
  body.add(nameplate);

  // the shaft collar between the motor and the head (it spins)
  const collar = new THREE.Group();
  collar.position.set(-HL / 2 - 0.012 * size, AXIS, 0);
  const disc = new THREE.Mesh(alongX(new THREE.CylinderGeometry(R * 0.55, R * 0.55, 0.012 * size, 24)), steel);
  collar.add(disc);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.014 * size, R * 1.0, 0.012 * size), dark);
    spoke.rotation.x = (i / 3) * Math.PI;
    collar.add(spoke);
  }
  body.add(collar);

  // the pump head: the volute, the front cover with its bolts, the suction port (front) and delivery port (up)
  const volute = new THREE.Mesh(alongX(new THREE.CylinderGeometry(HR, HR, HL, 40)), castIron);
  volute.position.set(0, AXIS, 0);
  body.add(volute);
  const bulge = new THREE.Mesh(alongX(new THREE.CylinderGeometry(HR * 0.7, HR * 0.7, HL * 0.92, 30)), castIron);
  bulge.position.set(0, AXIS + HR * 0.3, -HR * 0.32);
  body.add(bulge);
  const front = new THREE.Mesh(alongX(new THREE.CylinderGeometry(HR * 0.84, HR * 0.95, 0.022 * size, 40)), paint);
  front.position.set(HL / 2 + 0.011 * size, AXIS, 0);
  body.add(front);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const bolt = new THREE.Mesh(alongX(new THREE.CylinderGeometry(0.0075 * size, 0.0075 * size, 0.012, 6)), steel);
    bolt.position.set(HL / 2 + 0.025 * size, AXIS + Math.sin(a) * HR * 0.76, Math.cos(a) * HR * 0.76);
    body.add(bolt);
  }
  const PORT = 0.027; // the pipes' outer radius (40 mm pipe)
  const suction = new THREE.Mesh(alongX(new THREE.CylinderGeometry(PORT + 0.006, PORT + 0.01, 0.05 * size, 6)), brass);
  suction.position.set(HL / 2 + 0.022 * size + 0.025 * size, AXIS, 0);
  body.add(suction);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(PORT + 0.01, HR * 0.5, HR * 0.9, 24), castIron);
  neck.position.set(0, AXIS + HR + HR * 0.25, -0.0);
  body.add(neck);
  const union = new THREE.Mesh(new THREE.CylinderGeometry(PORT + 0.007, PORT + 0.007, 0.04, 6), brass);
  union.position.set(0, AXIS + HR * 1.7 + 0.02, 0);
  body.add(union);

  const outlet = new THREE.Vector3(0, AXIS + HR * 1.7 + 0.04, 0);
  const cableIn = gland.position.clone().setZ(cableSide * (0.05 * size + 0.014)); // where the power cable goes in
  const inlet = new THREE.Vector3(HL / 2 + 0.072 * size, AXIS, 0);

  // what a tap hits: the whole pump (invisible)
  const hitBox = new THREE.Box3().setFromObject(root);
  const hitSize = hitBox.getSize(new THREE.Vector3()).addScalar(0.08);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(hitSize.x, hitSize.y, hitSize.z), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(hitBox.getCenter(new THREE.Vector3()));
  hit.userData.noExport = true;
  root.add(hit);

  // the motor and the head, for the ring round the pumps (local: the group sits at the origin until it is placed)
  const ringBox = new THREE.Box3();
  for (const c of body.children) if (!stand.includes(/** @type {any} */ (c))) ringBox.expandByObject(c);

  // the body, the head and the plinth cast the pump's shadow and take the pipes' (the small bits add nothing)
  const casters = new Set([paint, castIron, concrete]);
  body.traverse((o) => {
    const mesh = /** @type {THREE.Mesh} */ (o);
    if (!mesh.isMesh) return;
    mesh.castShadow = mesh.receiveShadow = casters.has(/** @type {any} */ (mesh.material));
  });
  // every still part in one mesh per material (about 60 parts become 11 draw calls), the spinning collar apart
  bake(body, { keep: [collar, lampMesh], name, materials: SHARED });
  bake(collar, { name: `${name}_Collar`, materials: SHARED });

  let angle = 0;
  let lit = null;
  return {
    root,
    body,
    hit,
    outlet,
    inlet,
    cableIn,
    axis: AXIS,
    /** The visible pump (for the action's ring), without the hit box. */
    visual: body,
    /** The motor and the head (local), for the action's ring. */
    ringBox,
    /** Running or not; `dt` seconds of spinning; `phase` drives the tiny shake. */
    run(on, dt = 0, phase = 0) {
      if (on !== lit) {
        lit = on;
        lamp.emissive.set(on ? '#5cff6b' : '#000000');
        lamp.emissiveIntensity = on ? 1.6 : 1; // (1 with a black emissive: no glow, and a clean export)
        lamp.color.set(on ? '#8dff95' : lampOff.color);
      }
      if (on) angle += dt * 60;
      collar.rotation.x = angle;
      body.position.y = on ? Math.sin(phase * 190) * 0.0012 : 0;
    },
  };
}
