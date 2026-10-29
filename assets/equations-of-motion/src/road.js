// The street of the worked example (the car from rest to 60 km/hour in a minute), procedural three.js, in metres: a
// city avenue along x (asphalt, white edge lines, a dashed centre line) between raised paved footpaths with kerbs;
// behind the far footpath a row of colourful buildings, three to eight floors, with windows and balconies, shops on
// the ground floor under striped awnings, trees in round planters in front of them and a hazy skyline far behind;
// street lamps along the near footpath every 30 m (they also show how fast the car goes), a white start line at
// x = 0. The car may go 2 km: everything that repeats (road marks, paving, lamps, trees, buildings) is a few hundred
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
const TREE_EVERY = 15;
const BLOCK = 120; // m: the row of buildings repeats
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

/** Upper floors: one window with its frame and a balcony per 3 m × 3 m, on a wall of this colour. */
function floorTexture(wall) {
  return canvasTexture(96, 96, (ctx, w, h) => {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; // the floor line
    ctx.fillRect(0, 0, w, 3);
    ctx.fillStyle = '#f8f8f6'; // the window frame
    ctx.fillRect(17, 22, 62, 52);
    const g = ctx.createLinearGradient(0, 25, 0, 71); // glass with the sky in it
    g.addColorStop(0, '#9cc3df');
    g.addColorStop(1, '#3d5468');
    ctx.fillStyle = g;
    ctx.fillRect(21, 26, 26, 44);
    ctx.fillRect(49, 26, 26, 44);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; // the balcony: its shadow, slab and rail
    ctx.fillRect(12, 76, 72, 4);
    ctx.fillStyle = '#eceae4';
    ctx.fillRect(12, 72, 72, 5);
    ctx.fillStyle = 'rgba(60,60,60,0.55)';
    for (let x = 14; x < 84; x += 6) ctx.fillRect(x, 77, 1.5, 12);
    ctx.fillRect(12, 88, 72, 2);
  });
}

/** Ground floor: a shop window with a rolled-up shutter and a door per 4 m. */
function shopTexture() {
  return canvasTexture(128, 96, (ctx, w, h) => {
    ctx.fillStyle = '#e9e4da';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7d8790'; // the rolled-up shutter's box
    ctx.fillRect(8, 18, 112, 10);
    const g = ctx.createLinearGradient(0, 28, 0, h);
    g.addColorStop(0, '#5e7487');
    g.addColorStop(1, '#2c3a46');
    ctx.fillStyle = g;
    ctx.fillRect(10, 28, 108, 68);
    ctx.fillStyle = 'rgba(255,240,200,0.45)'; // lit goods on the shelves inside
    for (const [x, y, ww] of [
      [18, 46, 30],
      [72, 52, 22],
      [100, 44, 14],
      [24, 70, 26],
      [74, 74, 36],
    ])
      ctx.fillRect(x, y, ww, 6);
    ctx.fillStyle = '#d7d2c8';
    ctx.fillRect(62, 28, 4, 68); // the door's frame
  });
}

/** Awning stripes: two colours, 0.4 m each. */
function awningTexture(a, b) {
  return canvasTexture(32, 4, (ctx) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillStyle = b;
    ctx.fillRect(16, 0, 16, 4);
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

  // trees in round planters along the far footpath
  const trees = new THREE.Group();
  const potGeo = new THREE.CylinderGeometry(0.55, 0.5, 0.5, 16);
  const potMat = new THREE.MeshStandardMaterial({ name: 'Planter', color: 0xb5763f, roughness: 0.8 });
  const soilGeo = new THREE.CircleGeometry(0.48, 16);
  const soilMat = new THREE.MeshStandardMaterial({ name: 'Soil', color: 0x5a4632, roughness: 1 });
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.14, 2.2, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ name: 'Trunk', color: 0x7a5233, roughness: 0.9 });
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const greens = ['#3f9e3a', '#56ad44', '#2f8a3a'].map(
    (c) => new THREE.MeshStandardMaterial({ name: 'Leaves', color: c, roughness: 0.85, flatShading: true }),
  );
  const trand = seeded(23);
  for (let x = -SPAN / 2 + 7; x < SPAN / 2; x += TREE_EVERY) {
    const z = FAR_WALK[0] - 1.1;
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(x, WALK + 0.25, z);
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(x, WALK + 0.49, z);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, WALK + 1.5, z);
    const crown = new THREE.Mesh(crownGeo, greens[Math.floor(trand() * 3)]);
    const r = 1.2 + trand() * 0.35;
    crown.scale.set(r, r * 1.05, r);
    crown.rotation.y = trand() * 6;
    crown.position.set(x, WALK + 2.6 + r * 0.6, z);
    trees.add(pot, soil, trunk, crown);
  }
  add(trees, TREE_EVERY);

  // the row of buildings: shops under striped awnings, then floors of windows and balconies, a parapet on top
  const walls = ['#f3e3c3', '#f2b8b5', '#a9d2ee', '#b8e0c8', '#f7c99a', '#d2c6ee', '#f1efe8', '#e9c46a'];
  const wallMats = walls.map((c) => new THREE.MeshStandardMaterial({ name: 'Wall', map: floorTexture(c), roughness: 0.85 }));
  const plainMats = walls.map((c) => new THREE.MeshStandardMaterial({ name: 'Wall', color: c, roughness: 0.9 }));
  const shopMat = new THREE.MeshStandardMaterial({ name: 'Shops', map: shopTexture(), roughness: 0.6 });
  const awningTex = [
    ['#d6332e', '#f8f4ea'],
    ['#1c6fd9', '#f8f4ea'],
    ['#2b7a3a', '#f2d16b'],
    ['#f08c00', '#f8f4ea'],
    ['#c2255c', '#f8f4ea'],
  ].map(([a, b]) => awningTexture(a, b));
  const parapetMat = new THREE.MeshStandardMaterial({ name: 'Parapet', color: 0xf4f2ee, roughness: 0.8 });
  const brand = seeded(5);
  const spots = [];
  for (let x = 0; x < BLOCK - 9; ) {
    const w = 3 * Math.round(3 + brand() * 2.4); // 9 to 15 m: whole windows
    spots.push({
      x: x + w / 2,
      w,
      floors: 2 + Math.floor(brand() * 6),
      wall: Math.floor(brand() * walls.length),
      awning: Math.floor(brand() * awningTex.length),
    });
    x += w + (brand() < 0.3 ? 1.5 : 0.3);
  }
  /** A box whose faces show the texture at its real size (tileW × tileH m per repeat). */
  const sized = (w, h, d, tileW, tileH) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tileW, (uv.getY(i) * h) / tileH);
    return g;
  };
  const block = new THREE.Group();
  const D = 10; // each building's depth
  for (const p of spots) {
    const g = new THREE.Group();
    g.position.x = p.x;
    const plain = plainMats[p.wall];
    const shop = new THREE.Mesh(sized(p.w, 3.2, D, 4, 3.2), [plain, plain, plain, plain, shopMat, plain]);
    shop.position.set(0, WALK + 1.6, FRONT - D / 2);
    const H = p.floors * 3;
    const upper = new THREE.Mesh(sized(p.w, H, D, 3, 3), [plain, plain, plain, plain, wallMats[p.wall], plain]);
    upper.position.set(0, WALK + 3.2 + H / 2, FRONT - D / 2);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.1, 0.5, D + 0.1), parapetMat);
    parapet.position.set(0, WALK + 3.2 + H + 0.25, FRONT - D / 2);
    // the awning: a sloping striped sheet over the shops
    const tex = awningTex[p.awning].clone();
    tex.repeat.set((p.w - 0.6) / 0.8, 1);
    tex.needsUpdate = true;
    const awning = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w - 0.6, 1.4),
      new THREE.MeshStandardMaterial({ name: 'Awning', map: tex, roughness: 0.8, side: THREE.DoubleSide }),
    );
    awning.rotation.x = -Math.PI / 2 + 0.55;
    awning.position.set(0, WALK + 2.95, FRONT + 0.6);
    g.add(shop, upper, parapet, awning);
    block.add(g);
  }
  const copies = Math.ceil(SPAN / BLOCK) + 1;
  const row = new THREE.Group();
  for (let c = 0; c < copies; c++) {
    const b = c === 0 ? block : block.clone();
    b.position.x = c * BLOCK - SPAN / 2;
    row.add(b);
  }
  add(row, BLOCK);

  // the city behind, hazy: tall pale blocks well back, on a pale ground
  const haze = [0xc9d6e2, 0xbccbd9, 0xd4dee8].map((c) => new THREE.MeshBasicMaterial({ name: 'Skyline', color: c }));
  const hrand = seeded(41);
  const skyline = new THREE.Group();
  for (let x = -SPAN / 2; x < SPAN / 2; x += 9 + hrand() * 10) {
    const h = 22 + hrand() * 30;
    const m = new THREE.Mesh(new THREE.BoxGeometry(8 + hrand() * 8, h, 6), haze[Math.floor(hrand() * 3)]);
    m.position.set(x, h / 2, FRONT - 40 - hrand() * 20);
    skyline.add(m);
  }
  root.add(skyline); // it drifts along with the car (follow), a little slower: far away, no whole repeats to jump
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SPAN + 200, 120), new THREE.MeshBasicMaterial({ name: 'Ground', color: 0xcfc9be }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, FRONT - 60);
  add(ground, DASH);

  return {
    root,
    /** Keep the repeating things around x (m), moved by whole repeats so nothing jumps. */
    follow(x) {
      for (const [obj, repeat] of moving) obj.position.x = Math.floor(x / repeat) * repeat;
      skyline.position.x = x * 0.8;
    },
  };
}
