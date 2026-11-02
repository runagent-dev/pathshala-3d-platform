// The street of the worked example (the car from rest to 60 km/hour in a minute), procedural three.js, in metres: a
// plain avenue along x (asphalt, white edge lines, a dashed centre line) between raised paved footpaths with kerbs,
// soft ground beyond and nothing else but street lamps along the near footpath every 30 m (they show how fast the car
// goes) and a white start line at x = 0. The car may go 2 km: everything that repeats (road marks, paving, lamps) is a few hundred
// metres long and follow(x) moves it along with the car by whole repeats, so it looks endless. The road surface is
// at y = 0; the camera looks from +z.
import * as THREE from 'three';

export const LANE = 1.9; // z of the near lane's centre, where the car drives
const ROAD_W = 7.6;
const DASH = 18; // m: the road texture's repeat (two 3 m dashes, 6 m gaps)
const WALK = 0.15; // the footpaths' height above the road
const FAR_WALK = [-ROAD_W / 2 - 0.3, -ROAD_W / 2 - 5.6]; // z of the far footpath's kerb and back
const FRONT = FAR_WALK[1]; // the buildings' fronts
const LAMP_EVERY = 30;
const SPAN = 420; // m of repeating things around the car

const seeded = (s) => () => {
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
};
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Asphalt with its lines, one 18 m repeat (x across the canvas, the road's width down it). */
function roadTexture() {
  const PX = 32; // px per metre
  return canvasTexture(DASH * PX, Math.round(ROAD_W * PX), (ctx, w, h) => {
    ctx.fillStyle = '#585d64';
    ctx.fillRect(0, 0, w, h);
    const rand = seeded(11); // the stones in the asphalt: the same picture every time
    for (let i = 0; i < 2600; i++) {
      const g = 78 + Math.floor(rand() * 50);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 8},0.55)`;
      ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
    }
    ctx.fillStyle = 'rgba(28,30,34,0.13)'; // tyre-worn strips down each lane
    for (const z of [0.25, 0.75]) {
      ctx.fillRect(0, h * z - 0.95 * PX, w, 0.45 * PX);
      ctx.fillRect(0, h * z + 0.5 * PX, w, 0.45 * PX);
    }
    ctx.fillStyle = '#f4f5f2';
    ctx.fillRect(0, 0.18 * PX, w, 0.15 * PX); // the edge lines
    ctx.fillRect(0, h - 0.33 * PX, w, 0.15 * PX);
    for (const x0 of [0, 9]) ctx.fillRect(x0 * PX, h / 2 - 0.07 * PX, 3 * PX, 0.14 * PX); // the centre dashes
  });
}

/** Paving slabs, 1 m square, warm grey: one repeat of 2 × 2 m. */
function pavingTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d9d3c9';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#cbc3b6'; // two slightly different slabs
    ctx.fillRect(64, 0, 64, 64);
    ctx.fillRect(0, 64, 64, 64);
    const rand = seeded(3);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(120,110,95,0.12)';
      ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
    }
    ctx.strokeStyle = '#aaa194';
    ctx.lineWidth = 2;
    for (const k of [0, 64, 128]) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, h);
      ctx.moveTo(0, k);
      ctx.lineTo(w, k);
      ctx.stroke();
    }
  });
}

export function createRoad() {
  const root = new THREE.Group();
  root.name = 'Street';
  const moving = []; // [object, repeat]: moved by whole repeats with the car
  const add = (obj, repeat) => {
    root.add(obj);
    moving.push([obj, repeat]);
    return obj;
  };

  // the road and its lines
  const roadTex = roadTexture();
  roadTex.repeat.set(SPAN / DASH, 1);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(SPAN, ROAD_W),
    new THREE.MeshStandardMaterial({ name: 'Asphalt', map: roadTex, roughness: 0.92 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.name = 'RoadSurface';
  add(road, DASH);

  // the footpaths: paving on a raised slab, a light kerb stone along the road; the near one runs on towards the camera
  const kerbMat = new THREE.MeshStandardMaterial({ name: 'Kerb', color: 0xd2cdc4, roughness: 0.9 });
  const pave = (depth, z0) => {
    const tex = pavingTexture();
    tex.repeat.set(SPAN / 2, depth / 2);
    const top = new THREE.MeshStandardMaterial({ name: 'Paving', map: tex, roughness: 0.95 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(SPAN, WALK, depth), [kerbMat, kerbMat, top, kerbMat, kerbMat, kerbMat]);
    m.position.set(0, WALK / 2 - 0.001, z0 + depth / 2);
    return add(m, 2);
  };
  pave(FAR_WALK[0] - FAR_WALK[1], FAR_WALK[1]);
  pave(60, ROAD_W / 2 + 0.3);
  const stoneMat = new THREE.MeshStandardMaterial({ name: 'KerbStone', color: 0xeeeae2, roughness: 0.8 });
  for (const z of [FAR_WALK[0] + 0.15, ROAD_W / 2 + 0.15]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(SPAN, WALK + 0.02, 0.3), stoneMat);
    kerb.position.set(0, (WALK + 0.02) / 2, z);
    add(kerb, 2);
  }
  // the start line across the road at x = 0 (it stays where it is)
  const start = new THREE.Mesh(
    new THREE.PlaneGeometry(0.45, ROAD_W - 0.5),
    new THREE.MeshStandardMaterial({ name: 'StartLine', color: 0xfafafa, roughness: 0.7 }),
  );
  start.rotation.x = -Math.PI / 2;
  start.position.set(-0.22, 0.004, 0);
  root.add(start);

  // street lamps on the near footpath, their arms over the road
  const metal = new THREE.MeshStandardMaterial({ name: 'LampPost', color: 0x5d6670, roughness: 0.45, metalness: 0.6 });
  const glow = new THREE.MeshStandardMaterial({ name: 'Lamp', color: 0xfff8e1, emissive: 0xfff1c2, emissiveIntensity: 0.4, roughness: 0.3 });
  const lamps = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 7, 10);
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8);
  armGeo.rotateX(Math.PI / 2);
  const headGeo = new THREE.BoxGeometry(0.5, 0.14, 0.26);
  const baseGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10);
  for (let x = -SPAN / 2 + LAMP_EVERY / 2; x < SPAN / 2; x += LAMP_EVERY) {
    const z = ROAD_W / 2 + 0.9;
    const pole = new THREE.Mesh(poleGeo, metal);
    pole.position.set(x, WALK + 3.5, z);
    const base = new THREE.Mesh(baseGeo, metal);
    base.position.set(x, WALK + 0.25, z);
    const arm = new THREE.Mesh(armGeo, metal);
    arm.position.set(x, WALK + 6.9, z - 1.05);
    const head = new THREE.Mesh(headGeo, glow);
    head.position.set(x, WALK + 6.8, z - 2.1);
    lamps.add(pole, base, arm, head);
  }
  add(lamps, LAMP_EVERY);

  // nothing behind the far footpath (no buildings, trees or skyline): the car is the one thing to look at
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SPAN + 200, 120), new THREE.MeshBasicMaterial({ name: 'Ground', color: 0xcfc9be }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, FRONT - 60);
  add(ground, DASH);

  return {
    root,
    /** Keep the repeating things around x (m), moved by whole repeats so nothing jumps. */
    follow(x) {
      for (const [obj, repeat] of moving) obj.position.x = Math.floor(x / repeat) * repeat;
    },
  };
}
