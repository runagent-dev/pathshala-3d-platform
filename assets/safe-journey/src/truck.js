// The heavy truck (অনেক ভারী পাথর বোঝাই ট্রাক), in real metres: the Bangladeshi goods truck of the sister figure
// `momentum` (a mustard flat-front cab with a red band, a painted visor and the wooden "crown" over the cab roof, a
// wooden cargo body, dual rear wheels with red hubs), here heaped with grey stones above its sides, so it looks as
// heavy as the book says. Origin on the ground under the front bumper, +x forward, +y up. roll(m) turns the wheels.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TRUCK = { length: 6.8, width: 2.4, height: 3.05, wheel: 0.5, front: -1.25, rear: -5.2 };

const mat = (name, color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
/** A small seeded random generator (the stones lie the same way every time). */
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** The cab's paint: mustard above, a white line, a red band, a dark skirt (horizontal bands, so any face works). */
function cabTexture() {
  const c = canvas(8, 256);
  const ctx = c.getContext('2d');
  const band = (from, to, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, Math.round(from * 256), 8, Math.ceil((to - from) * 256));
  };
  band(0, 0.58, '#e3a82c');
  band(0.58, 0.62, '#f7f3e8');
  band(0.62, 0.8, '#c0392b');
  band(0.8, 0.83, '#f7f3e8');
  band(0.83, 1, '#3b3f46');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Folk-art painting for the visor and the crown: red and yellow diamonds with white dots on deep red. */
function paintTexture() {
  const c = canvas(256, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7b1e2b';
  ctx.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 8; i++) {
    const x = 16 + i * 32;
    ctx.fillStyle = i % 2 ? '#f2c230' : '#e8eef0';
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x + 12, 32);
    ctx.lineTo(x, 56);
    ctx.lineTo(x - 12, 32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(x, 32, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(0, 0, 256, 4);
  ctx.fillRect(0, 60, 256, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Wooden planks, horizontal, with a painted red rail along the top. */
function woodTexture() {
  const c = canvas(256, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9a6a3d';
  ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 5; i++) {
    const y = 22 + i * 21;
    ctx.fillStyle = '#6f4925';
    ctx.fillRect(0, y, 256, 2);
    ctx.fillStyle = 'rgba(255,230,190,0.12)';
    ctx.fillRect(0, y + 2, 256, 3);
  }
  ctx.fillStyle = '#b8352b';
  ctx.fillRect(0, 0, 256, 20);
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(0, 18, 256, 3);
  for (let x = 30; x < 256; x += 64) {
    ctx.fillStyle = '#5d3c1e';
    ctx.fillRect(x, 20, 5, 108); // the uprights
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function createTruck({ name = 'Truck' } = {}) {
  const root = new THREE.Group();
  root.name = name;
  const body = new THREE.Group(); // everything above the wheels
  body.name = 'TruckBody';
  root.add(body);
  const M = {
    cab: mat('CabPaint', '#ffffff', 0.45, 0.05, { map: cabTexture() }),
    paint: mat('FolkPaint', '#ffffff', 0.6, 0, { map: paintTexture() }),
    wood: mat('Wood', '#ffffff', 0.85, 0, { map: woodTexture() }),
    plain: mat('WoodPlain', '#8f603a', 0.85),
    stone: mat('Stone', '#ffffff', 0.92, 0, { flatShading: true }),
    dark: mat('Chassis', '#2f3338', 0.7, 0.2),
    bumper: mat('Bumper', '#3a3f45', 0.5, 0.3),
    chrome: mat('Chrome', '#d7dce1', 0.2, 0.9),
    glass: mat('Glass', '#24323e', 0.12, 0.4),
    tyre: mat('Tyre', '#23262a', 0.88),
    hub: mat('Hub', '#b8302a', 0.45, 0.3),
    lamp: mat('Headlamp', '#fff6d8', 0.2, 0, { emissive: '#fff1c4', emissiveIntensity: 0.35 }),
    red: mat('TailLamp', '#d0322a', 0.3, 0, { emissive: '#a01e18', emissiveIntensity: 0.4 }),
  };
  const add = (geo, m, x, y, z, parent = body, nm = '') => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    if (nm) mesh.name = nm;
    parent.add(mesh);
    return mesh;
  };

  // chassis rails and the front bumper
  for (const z of [-0.5, 0.5]) add(new THREE.BoxGeometry(6.3, 0.22, 0.16), M.dark, -3.45, 0.66, z, body, 'Rail');
  add(new RoundedBoxGeometry(0.24, 0.34, 2.38, 2, 0.05), M.bumper, -0.12, 0.6, 0, body, 'Bumper');

  // the cab (flat front), painted in bands
  const cabX = -1.0;
  add(new RoundedBoxGeometry(1.9, 1.9, 2.3, 3, 0.13), M.cab, cabX, 1.8, 0, body, 'Cab');
  const ws = add(new THREE.PlaneGeometry(2.0, 0.72), M.glass, cabX + 0.952, 2.22, 0, body, 'Windscreen');
  ws.rotation.y = Math.PI / 2;
  for (const s of [-1, 1]) {
    const w = add(new THREE.PlaneGeometry(0.85, 0.6), M.glass, cabX + 0.32, 2.22, s * 1.152, body, 'SideWindow');
    w.rotation.y = s > 0 ? 0 : Math.PI;
  }
  const grille = add(new THREE.PlaneGeometry(1.5, 0.42), M.dark, cabX + 0.953, 1.3, 0, body, 'Grille');
  grille.rotation.y = Math.PI / 2;
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.03, 0.035, 1.46), M.chrome, cabX + 0.965, 1.15 + i * 0.1, 0, body, 'GrilleBar');
  for (const z of [-0.92, 0.92]) {
    const l = add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 18), M.lamp, cabX + 0.96, 1.3, z, body, 'Headlamp');
    l.rotation.z = Math.PI / 2;
  }
  add(new THREE.BoxGeometry(0.32, 0.22, 2.32), M.paint, cabX + 0.86, 2.86, 0, body, 'Visor');
  const crown = add(new THREE.BoxGeometry(1.5, 0.1, 2.36), M.paint, -1.32, 2.96, 0, body, 'Crown');
  crown.rotation.z = 0.06;
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.04, 0.04, 0.3), M.dark, cabX + 0.82, 2.25, s * 1.28, body, 'MirrorArm');
    add(new RoundedBoxGeometry(0.06, 0.32, 0.16, 2, 0.02), M.dark, cabX + 0.8, 2.15, s * 1.43, body, 'Mirror');
  }

  // the cargo body: deck, wooden sides (painted rail on top), tailgate, the tall headboard behind the cab
  const deckX = -4.47;
  const deckLen = 4.62;
  add(new THREE.BoxGeometry(deckLen, 0.14, 2.42), M.dark, deckX, 1.1, 0, body, 'Deck');
  const sideGeo = new THREE.BoxGeometry(deckLen, 1.15, 0.07);
  for (const s of [-1, 1]) add(sideGeo, M.wood, deckX, 1.75, s * 1.175, body, 'CargoSide');
  add(new THREE.BoxGeometry(0.07, 1.15, 2.42), M.wood, deckX - deckLen / 2 + 0.035, 1.75, 0, body, 'Tailgate');
  add(new THREE.BoxGeometry(0.1, 1.85, 2.42), M.plain, -2.16, 2.03, 0, body, 'Headboard');

  // the load: a heap of grey stones filling the body and rising above its sides in the middle
  {
    const r = rand(21);
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const n = 150;
    const stones = new THREE.InstancedMesh(geo, M.stone, n);
    stones.name = 'Stones';
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const col = new THREE.Color();
    const x0 = deckX - deckLen / 2 + 0.2;
    const x1 = deckX + deckLen / 2 - 0.25;
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0);
      const z = (r() * 2 - 1) * 1.0;
      // the heap: highest along the middle, lower toward the sides and the ends
      const ux = (x - (x0 + x1) / 2) / ((x1 - x0) / 2);
      const top = 2.25 + 0.5 * (1 - ux * ux) * (1 - 0.55 * z * z);
      const y = 1.3 + r() * (top - 1.3);
      const s = 0.17 + r() * 0.14;
      pos.set(x, y, z);
      scl.set(s * (0.8 + r() * 0.5), s * (0.65 + r() * 0.35), s * (0.8 + r() * 0.5));
      q.setFromEuler(e.set(r() * 6.3, r() * 6.3, r() * 6.3));
      stones.setMatrixAt(i, m4.compose(pos, q, scl));
      const g = 0.5 + r() * 0.18;
      stones.setColorAt(i, col.setRGB(g * 1.02, g, g * 0.95));
    }
    body.add(stones);
  }

  // mudguards and tail lamps
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(1.25, 0.06, 0.62), M.dark, TRUCK.rear, 1.03, s * 0.98, body, 'Mudguard');
    add(new THREE.BoxGeometry(0.05, 0.18, 0.3), M.red, -6.79, 0.98, s * 0.98, body, 'TailLamp');
  }
  const tank = add(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 16), M.chrome, -2.85, 0.72, 0.86, body, 'FuelTank');
  tank.rotation.z = Math.PI / 2;

  // wheels: single at the front, dual at the back
  const wheels = [];
  const tyreGeo = new THREE.CylinderGeometry(TRUCK.wheel, TRUCK.wheel, 0.28, 26).rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.3, 14).rotateX(Math.PI / 2);
  const boltGeo = new THREE.BoxGeometry(0.06, 0.06, 0.32);
  const spot = (x, z) => {
    const w = new THREE.Group();
    w.name = 'Wheel';
    w.position.set(x, TRUCK.wheel, z);
    w.add(new THREE.Mesh(tyreGeo, M.tyre), new THREE.Mesh(hubGeo, M.hub));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const b = new THREE.Mesh(boltGeo, M.chrome);
      b.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0);
      w.add(b);
    }
    root.add(w);
    wheels.push(w);
  };
  for (const z of [-0.98, 0.98]) spot(TRUCK.front, z);
  for (const z of [-1.12, -0.82, 0.82, 1.12]) spot(TRUCK.rear, z);

  // a big invisible box round it: a tap anywhere on the truck works
  const hit = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(-3.4, 1.7, 0);
  hit.userData.noExport = true;
  hit.name = 'TruckHit';
  root.add(hit);

  return {
    root,
    body,
    hit,
    /** Turn the wheels for `distance` m of road (positive forward). */
    roll(distance) {
      for (const w of wheels) w.rotation.z = -distance / TRUCK.wheel;
    },
  };
}
