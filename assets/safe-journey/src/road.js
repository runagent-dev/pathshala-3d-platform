// The road, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a two-lane highway
// on a river embankment, as so many of Bangladesh's highways run. Grey asphalt with worn wheel paths, white edge
// lines and a dashed centre line; shoulders of brick ballast; verges of dry grass with white guard posts on the far
// side and a kilometre stone on the near one. Beyond the far verge the embankment slopes down to a muddy bank with
// white kash grass, then the river (its water a cool teal, rippled), with country boats on it and, far off, the other
// bank: trees, tin-roofed houses and a brick kiln's chimney. Beyond the near verge, harvested fields. The arrows'
// blue and the energy cubes' amber appear nowhere in it: the cubes stand out against the water, the arrows lie on the
// asphalt. Long enough for every run (x from −60 m to +60 m); the scenery is a few meshes, each surface one canvas
// texture drawn once, the repeated things instanced.
import * as THREE from 'three';
import { mergePlaced } from './merge.js';

export const ROAD = { half: 3.6, length: 120, lane: 1.2, shoulder: 0.9, verge: 2.0 };
/** The river side (z < 0): the slope's foot, the water's level (m below the road) and where the water starts. */
const BANK = { slopeTo: -11.6, low: -2.4, water: -2.5, waterFrom: -13 };

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const texture = (c, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
};
/** Specks over a filled canvas: n of them, `light` or `dark`, 1–3 px. */
function grit(ctx, w, h, n, seed, colours) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colours[Math.floor(r() * colours.length)];
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}
/** Short strokes of grass over a filled canvas (dry blades, some greener). */
function blades(ctx, w, h, n, seed, colours) {
  const r = rand(seed);
  ctx.lineWidth = 1.3;
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const l = 3 + r() * 6;
    const a = -Math.PI / 2 + (r() - 0.5) * 1.2;
    ctx.strokeStyle = colours[Math.floor(r() * colours.length)];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
}

/** A flat strip along the road at z (its middle), `width` wide, its canvas tiled every `tile` m along x. */
function strip(name, c, length, width, z, tile, y = 0, tileZ = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshStandardMaterial({ name, map: texture(c, length / tile, tileZ ? width / tileZ : 1), roughness: 0.95 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, y, z);
  m.receiveShadow = true;
  m.name = name;
  return m;
}
/** Two strips with one canvas, at z and −z: one mesh. */
function twoStrips(name, c, length, width, z, tile, y = 0) {
  const geo = mergePlaced(
    [-1, 1].map((s) => [
      new THREE.PlaneGeometry(length, width),
      new THREE.Matrix4().makeTranslation(0, y, s * z).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)),
    ]),
  );
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name, map: texture(c, length / tile, 1), roughness: 0.95 }));
  m.receiveShadow = true;
  m.name = name;
  return m;
}

export function createRoad({ length = ROAD.length, scenery = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Road';
  const W = ROAD.half * 2;
  const L = length;

  // asphalt: 8 m of road in the texture (a 3 m dash and a 5 m gap on the centre line), 64 px per metre along it;
  // darker wheel paths in each lane, a few patches and cracks
  {
    const c = canvas(512, 512);
    const ctx = c.getContext('2d');
    const zpx = (z) => ((z + ROAD.half) / W) * 512; // canvas row of a z
    ctx.fillStyle = '#7d8288';
    ctx.fillRect(0, 0, 512, 512);
    grit(ctx, 512, 512, 9000, 7, ['rgba(150,154,160,0.5)', 'rgba(96,100,106,0.5)', 'rgba(170,170,166,0.35)']);
    // the wheel paths: two darker bands in each lane
    for (const lane of [-ROAD.lane, ROAD.lane])
      for (const d of [-0.8, 0.8]) {
        const g = ctx.createLinearGradient(0, zpx(lane + d - 0.35), 0, zpx(lane + d + 0.35));
        g.addColorStop(0, 'rgba(60,64,70,0)');
        g.addColorStop(0.5, 'rgba(60,64,70,0.22)');
        g.addColorStop(1, 'rgba(60,64,70,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, zpx(lane + d - 0.35), 512, zpx(0.7) - zpx(0));
      }
    // patches of newer asphalt and thin cracks
    const r = rand(11);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(70,74,80,0.35)';
      ctx.fillRect(r() * 440, zpx(-2.8 + r() * 5), 30 + r() * 50, 18 + r() * 26);
    }
    ctx.strokeStyle = 'rgba(52,55,60,0.55)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      let x = r() * 512;
      let y = zpx(-3 + r() * 6);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += 6 + r() * 10;
        y += (r() - 0.5) * 9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#f2f2ec';
    ctx.fillRect(0, zpx(0) - 5, 3 * 64, 10); // the centre dashes
    for (const z of [-ROAD.half + 0.2, ROAD.half - 0.2]) ctx.fillRect(0, zpx(z) - 5, 512, 9); // edge lines
    root.add(strip('Asphalt', c, L, W, 0, 8));
  }
  // shoulders of brick ballast: red-brown grit, a little lighter at the asphalt's edge
  {
    const c = canvas(128, 64);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#a8765a';
    ctx.fillRect(0, 0, 128, 64);
    grit(ctx, 128, 64, 700, 3, ['rgba(140,70,46,0.55)', 'rgba(196,150,118,0.5)', 'rgba(96,70,56,0.45)']);
    root.add(twoStrips('Shoulder', c, L, ROAD.shoulder, ROAD.half + ROAD.shoulder / 2, 2, -0.004));
  }
  // verges of dry grass: straw and olive on brown earth (the far one ends at the slope, the near one at the fields)
  const verge = canvas(256, 128);
  {
    const ctx = verge.getContext('2d');
    ctx.fillStyle = '#a99161';
    ctx.fillRect(0, 0, 256, 128);
    grit(ctx, 256, 128, 500, 5, ['rgba(120,92,58,0.5)', 'rgba(150,126,84,0.45)']);
    blades(ctx, 256, 128, 900, 6, ['#c9b57a', '#bda463', '#8d8a4c', '#7d7a42', '#d7c58e']);
    root.add(twoStrips('Verge', verge, L, ROAD.verge, ROAD.half + ROAD.shoulder + ROAD.verge / 2, 4, -0.008));
  }
  if (!scenery) return { root };
  const edge = ROAD.half + ROAD.shoulder + ROAD.verge; // 6.5 m from the middle of the road
  const scene = new THREE.Group();
  scene.name = 'Scenery';
  scene.userData.noExport = true;
  root.add(scene);
  const R = 200; // half the length of the river and the fields

  // the embankment's slope down to the river: earth with grass and a few runnels
  {
    const c = canvas(256, 256);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#a48c5c'); // the top (by the verge)
    g.addColorStop(1, '#8a6e4a'); // the foot (damper)
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    grit(ctx, 256, 256, 900, 13, ['rgba(110,84,54,0.5)', 'rgba(160,136,96,0.45)']);
    blades(ctx, 256, 256, 1500, 14, ['#b9a46a', '#8f8a4a', '#76773e', '#c8b47c', '#6d7a3c']);
    ctx.strokeStyle = 'rgba(96,72,46,0.45)';
    ctx.lineWidth = 2;
    const r = rand(15);
    for (let i = 0; i < 5; i++) {
      const x = r() * 256;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 10, 80, x - 12, 170, x + 4, 256);
      ctx.stroke();
    }
    const run = Math.hypot(-BANK.slopeTo - edge, BANK.low);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * R, run),
      new THREE.MeshStandardMaterial({ name: 'Slope', map: texture(c, (2 * R) / 6, 1), roughness: 0.95 }),
    );
    m.rotation.x = -Math.PI / 2 - Math.atan2(-BANK.low, -BANK.slopeTo - edge); // falls away from the road
    m.position.set(0, BANK.low / 2, -(edge - BANK.slopeTo) / 2);
    m.receiveShadow = true;
    m.name = 'Slope';
    scene.add(m);
  }
  // the muddy bank at the water's edge, darker where it is wet
  {
    const c = canvas(128, 64);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, '#86684a');
    g.addColorStop(1, '#5e4a38');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 64);
    grit(ctx, 128, 64, 260, 19, ['rgba(70,54,40,0.5)', 'rgba(150,124,94,0.4)']);
    scene.add(strip('Bank', c, 2 * R, BANK.slopeTo - BANK.waterFrom + 0.4, (BANK.slopeTo + BANK.waterFrom - 0.4) / 2, 3, BANK.low));
  }
  // the river: cool teal water with long ripples catching the light (a little shine from the sky)
  const waterDepth = 150;
  {
    const c = canvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4f8796';
    ctx.fillRect(0, 0, 512, 512);
    const r = rand(23);
    for (let i = 0; i < 520; i++) {
      const y = r() * 512;
      const x = r() * 512;
      const l = 14 + r() * 60;
      ctx.fillStyle = r() < 0.6 ? `rgba(196,226,232,${0.18 + r() * 0.25})` : `rgba(40,92,108,${0.25 + r() * 0.25})`;
      ctx.fillRect(x, y, l, 1.5 + r() * 1.5);
      if (x + l > 512) ctx.fillRect(x - 512, y, l, 2); // seamless across the tile
    }
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * R, waterDepth),
      new THREE.MeshStandardMaterial({ name: 'River', map: texture(c, (2 * R) / 18, waterDepth / 18), roughness: 0.32, metalness: 0.1 }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, BANK.water, BANK.waterFrom + 0.2 - waterDepth / 2);
    m.name = 'River';
    scene.add(m);
  }
  // the near side, beyond the verge: harvested paddy fields, the stubble in rows, low earth ridges between the
  // plots, and stacks of straw round their poles
  {
    const c = canvas(512, 512);
    const ctx = c.getContext('2d');
    const plots = ['#b49656', '#a5874c', '#bd9f60', '#9a7c48'];
    const r = rand(29);
    for (let i = 0; i < 4; i++) {
      const x0 = (i % 2) * 256;
      const y0 = Math.floor(i / 2) * 256;
      ctx.fillStyle = plots[i];
      ctx.fillRect(x0, y0, 256, 256);
      // the stubble: short dark-gold strokes in rows, the rows of each plot at its own angle
      ctx.strokeStyle = i % 2 ? 'rgba(112,86,46,0.55)' : 'rgba(214,190,126,0.6)';
      ctx.lineWidth = 1.4;
      for (let y = y0 + 8; y < y0 + 250; y += 9)
        for (let x = x0 + 6 + (y % 18 ? 0 : 4); x < x0 + 250; x += 8) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (r() - 0.5) * 2, y - 3 - r() * 3);
          ctx.stroke();
        }
    }
    grit(ctx, 512, 512, 1600, 30, ['rgba(120,92,56,0.4)', 'rgba(210,186,130,0.35)']);
    ctx.fillStyle = '#8c6a44'; // the ridges (আইল)
    for (const k of [0, 256]) {
      ctx.fillRect(0, k, 512, 7);
      ctx.fillRect(k, 0, 7, 512);
    }
    scene.add(strip('Fields', c, 2 * R, 60, edge + 30, 28, -0.012, 28));
    // straw stacks: a cone on a short drum, a little leaning (instanced)
    const drum = new THREE.CylinderGeometry(1.1, 1.25, 1.6, 12).translate(0, 0.8, 0);
    const cone = new THREE.ConeGeometry(1.25, 1.9, 12).translate(0, 2.55, 0);
    const straw = new THREE.MeshStandardMaterial({ name: 'Straw', color: '#c9a557', roughness: 1, flatShading: true });
    const stacks = [
      [-21, 13],
      [-17.5, 15.5],
      [9, 17],
      [24, 12.5],
      [27.5, 14],
      [-38, 18],
    ];
    const drums = new THREE.InstancedMesh(drum, straw, stacks.length);
    const cones = new THREE.InstancedMesh(cone, straw, stacks.length);
    const m4 = new THREE.Matrix4();
    stacks.forEach(([x, z], i) => {
      m4.makeRotationY(r() * 6.3).setPosition(x, 0, z);
      drums.setMatrixAt(i, m4);
      cones.setMatrixAt(i, m4);
    });
    drums.name = 'StrawStacks';
    cones.name = 'StrawStackTops';
    scene.add(drums, cones);
  }
  // white guard posts along the far verge, a red reflector on each (instanced)
  {
    const geo = new THREE.BoxGeometry(0.14, 0.75, 0.14).translate(0, 0.375, 0);
    const posts = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ name: 'GuardPost', color: '#f1efe8', roughness: 0.6 }), 64);
    const bands = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.15, 0.12, 0.15).translate(0, 0.6, 0),
      new THREE.MeshStandardMaterial({ name: 'GuardBand', color: '#2b2f35', roughness: 0.6 }),
      64,
    );
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let x = -L / 2 + 2; x < L / 2 && n < 64; x += 4, n++) {
      m4.makeTranslation(x, 0, -(ROAD.half + ROAD.shoulder + 0.5));
      posts.setMatrixAt(n, m4);
      bands.setMatrixAt(n, m4);
    }
    posts.count = bands.count = n;
    posts.name = 'GuardPosts';
    bands.name = 'GuardBands';
    scene.add(posts, bands);
  }
  // a kilometre stone on the near verge (white, its top painted yellow), as on the country's highways
  {
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.5, 0.18).translate(0, 0.25, 0),
      new THREE.MeshStandardMaterial({ name: 'KmStone', color: '#f2f0ea', roughness: 0.7 }),
    );
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.18, 16, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, 0.5, 0),
      new THREE.MeshStandardMaterial({ name: 'KmCap', color: '#e2a82c', roughness: 0.6 }),
    );
    for (const m of [stone, cap]) {
      m.position.set(-17, 0, ROAD.half + ROAD.shoulder + 0.9);
      m.rotation.y = 0.25;
      scene.add(m);
    }
  }
  // white kash grass in clumps at the slope's foot and along the bank (thin cones, plumes at their tips)
  {
    const r = rand(31);
    const blade = new THREE.ConeGeometry(0.05, 1.3, 4).translate(0, 0.65, 0);
    const plume = new THREE.IcosahedronGeometry(1, 0).scale(0.085, 0.3, 0.085).translate(0, 1.5, 0); // a soft tuft
    const clump = (geo) =>
      mergePlaced(
        Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const m = new THREE.Matrix4().makeTranslation(Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18);
          return [geo, m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25)))];
        }),
      );
    const stems = new THREE.InstancedMesh(clump(blade), new THREE.MeshStandardMaterial({ name: 'KashStem', color: '#8c8a52', roughness: 0.9 }), 90);
    const plumes = new THREE.InstancedMesh(
      clump(plume),
      new THREE.MeshStandardMaterial({ name: 'KashPlume', color: '#eee8d8', roughness: 1, flatShading: true }),
      90,
    );
    blade.dispose();
    plume.dispose();
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    let n = 0;
    for (let x = -R / 2; x < R / 2 && n < 90; x += 1.6 + r() * 3.4) {
      const s = 0.8 + r() * 0.6;
      p.set(x, BANK.low, BANK.slopeTo - 0.3 - r() * 1.2);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.3);
      sc.set(s, s * (0.85 + r() * 0.4), s);
      m4.compose(p, q, sc);
      stems.setMatrixAt(n, m4);
      plumes.setMatrixAt(n, m4);
      n++;
    }
    stems.count = plumes.count = n;
    stems.name = 'KashStems';
    plumes.name = 'KashPlumes';
    scene.add(stems, plumes);
  }
  // country boats on the river: a dark wooden hull with raised ends and a cane-mat canopy; one under a patched sail
  {
    const hullGeo = (() => {
      const g = new THREE.BoxGeometry(6, 0.55, 1.5, 16, 1, 3);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / 3; // −1 … 1 along the boat
        const taper = 1 - x * x;
        p.setZ(i, p.getZ(i) * (0.12 + 0.88 * Math.sqrt(Math.max(0, taper))));
        p.setY(i, p.getY(i) * (0.6 + 0.4 * taper) + 0.55 * x * x * x * x + (p.getY(i) < 0 ? 0.12 * x * x : 0));
      }
      g.computeVertexNormals();
      return g.translate(0, 0.2, 0);
    })();
    const canopyGeo = new THREE.CylinderGeometry(0.72, 0.72, 2.2, 14, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(0.2, 0.55, 0);
    const spots = [
      [-16, -24, 0.2],
      [-30, -38, -0.15],
      [27, -21, 0.35],
      [12, -46, -0.3],
    ];
    const hulls = new THREE.InstancedMesh(
      hullGeo,
      new THREE.MeshStandardMaterial({ name: 'BoatHull', color: '#4a3324', roughness: 0.8 }),
      spots.length,
    );
    const canopies = new THREE.InstancedMesh(
      canopyGeo,
      new THREE.MeshStandardMaterial({ name: 'BoatCanopy', color: '#b98f52', roughness: 0.9, side: THREE.DoubleSide }),
      spots.length,
    );
    const m4 = new THREE.Matrix4();
    spots.forEach(([x, z, a], i) => {
      m4.makeRotationY(a).setPosition(x, BANK.water, z);
      hulls.setMatrixAt(i, m4);
      canopies.setMatrixAt(i, m4);
    });
    hulls.name = 'BoatHulls';
    canopies.name = 'BoatCanopies';
    scene.add(hulls, canopies);
    // the sail: a tall patched trapezium of red and cream cloth on a bamboo mast
    const c = canvas(128, 128);
    const ctx = c.getContext('2d');
    const patches = ['#b8402f', '#e9dcc0', '#c96a32', '#9c3328', '#e3cfa4'];
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = patches[(i * 3 + j * 2) % patches.length];
        ctx.fillRect(i * 32, j * 32, 32, 32);
      }
    ctx.strokeStyle = 'rgba(60,40,30,0.5)';
    for (let k = 0; k <= 128; k += 32) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, 128);
      ctx.moveTo(0, k);
      ctx.lineTo(128, k);
      ctx.stroke();
    }
    const sailTex = new THREE.CanvasTexture(c);
    sailTex.colorSpace = THREE.SRGBColorSpace;
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, 0);
    shape.lineTo(1.4, 0);
    shape.lineTo(0.9, 3.6);
    shape.lineTo(-0.8, 3.9);
    shape.closePath();
    const sailGeo = new THREE.ShapeGeometry(shape);
    const uv = sailGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 1.2) / 2.6, uv.getY(i) / 3.9);
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ name: 'Sail', map: sailTex, roughness: 0.9, side: THREE.DoubleSide }));
    sail.position.set(-29.6, BANK.water + 1.1, -38);
    sail.rotation.y = -0.15 + 0.35;
    sail.name = 'Sail';
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 5.4, 6),
      new THREE.MeshStandardMaterial({ name: 'Mast', color: '#7a6040', roughness: 0.8 }),
    );
    mast.position.set(-30, BANK.water + 3, -38);
    mast.name = 'Mast';
    scene.add(sail, mast);
  }
  // the other bank, far off: a strip of land, trees in many greens, tin-roofed houses and a brick kiln's chimney
  {
    const farZ = BANK.waterFrom + 0.2 - waterDepth; // where the water ends
    const land = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * R, 40),
      new THREE.MeshStandardMaterial({ name: 'FarBank', color: '#8f8058', roughness: 1 }),
    );
    land.rotation.x = -Math.PI / 2;
    land.position.set(0, BANK.water + 0.4, farZ - 18);
    land.name = 'FarBank';
    scene.add(land);
    const r = rand(41);
    // houses: walls of mud, blue or pink plaster under gabled roofs of tin (silver, or rusty)
    const wallGeo = new THREE.BoxGeometry(5, 2.6, 4).translate(0, 1.3, 0);
    const roofGeo = (() => {
      const s = new THREE.Shape();
      s.moveTo(-2.4, 0);
      s.lineTo(2.4, 0);
      s.lineTo(0, 1.5);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 5.6, bevelEnabled: false }).translate(0, 2.6, -2.8).rotateY(Math.PI / 2);
    })();
    const N = 22;
    const walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ name: 'HouseWall', roughness: 0.9 }), N);
    const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ name: 'TinRoof', roughness: 0.45, metalness: 0.4 }), N);
    const wallColours = ['#c9a06a', '#d7b98a', '#8fa4bf', '#d9a092', '#e6dcc4', '#b8875a'].map((c) => new THREE.Color(c));
    const roofColours = ['#a9b1b6', '#8c5a3c', '#b9bfc2', '#7d4f36', '#9aa3a8'].map((c) => new THREE.Color(c));
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      p.set(-R / 2 + (i + r() * 0.6) * (R / N), BANK.water + 0.4, farZ - 6 - r() * 14);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (r() - 0.5) * 0.6);
      const s = 0.8 + r() * 0.5;
      sc.set(s, s, s);
      m4.compose(p, q, sc);
      walls.setMatrixAt(i, m4);
      roofs.setMatrixAt(i, m4);
      walls.setColorAt(i, wallColours[Math.floor(r() * wallColours.length)]);
      roofs.setColorAt(i, roofColours[Math.floor(r() * roofColours.length)]);
    }
    walls.name = 'Houses';
    roofs.name = 'TinRoofs';
    scene.add(walls, roofs);
    // trees: crowns of three blobs on a trunk, in deep and olive greens (instanced)
    const T = 70;
    const crowns = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ name: 'Leaves', roughness: 0.95, flatShading: true }),
      T * 3,
    );
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.25, 0.35, 1, 6).translate(0, 0.5, 0),
      new THREE.MeshStandardMaterial({ name: 'Trunk', color: '#6a5240', roughness: 0.9 }),
      T,
    );
    const greens = ['#4d6e36', '#5e7d3c', '#6f8a44', '#7d8c4a', '#55703e', '#8a8f50'].map((c) => new THREE.Color(c));
    let k = 0;
    for (let i = 0; i < T; i++) {
      const x = -R / 2 + (i + r()) * (R / T);
      const z = farZ - 2 - r() * 22;
      const h = 3 + r() * 3;
      m4.compose(p.set(x, BANK.water + 0.4, z), q.identity(), sc.set(1, h, 1));
      trunks.setMatrixAt(i, m4);
      const g = greens[Math.floor(r() * greens.length)];
      for (let j = 0; j < 3; j++) {
        const s = 1.6 + r() * 1.4;
        m4.compose(
          p.set(x + (j - 1) * 1.6 + (r() - 0.5), BANK.water + 0.4 + h + 0.8 + r() * 1.2, z + (r() - 0.5) * 1.5),
          q.identity(),
          sc.set(s * 1.2, s * 0.85, s),
        );
        crowns.setMatrixAt(k, m4);
        crowns.setColorAt(k++, g);
      }
    }
    crowns.name = 'Trees';
    trunks.name = 'Trunks';
    scene.add(crowns, trunks);
    // a brick kiln's tall chimney
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.6, 26, 12).translate(0, 13, 0),
      new THREE.MeshStandardMaterial({ name: 'Kiln', color: '#9a4a32', roughness: 0.9 }),
    );
    chimney.position.set(34, BANK.water + 0.4, farZ - 20);
    chimney.name = 'KilnChimney';
    scene.add(chimney);
  }
  // a few trees on the slope by the river, their trunks painted white at the foot as along the highways
  {
    const r = rand(17);
    const spots = [];
    for (let x = -L / 2 + 5; x < L / 2 - 5; x += 13 + r() * 6) spots.push([x, -8.4 - r() * 0.8]);
    const n = spots.length;
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.16, 0.24, 1, 8).translate(0, 0.5, 0),
      new THREE.MeshStandardMaterial({ name: 'SlopeTrunk', color: '#6e5642', roughness: 0.9 }),
      n,
    );
    const paint = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.255, 0.255, 1, 8).translate(0, 0.5, 0),
      new THREE.MeshStandardMaterial({ name: 'TrunkPaint', color: '#f1eee6', roughness: 0.8 }),
      n,
    );
    const crowns = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ name: 'SlopeLeaves', roughness: 0.95, flatShading: true }),
      n * 3,
    );
    const greens = ['#56763a', '#647f3f', '#4e6c38'].map((c) => new THREE.Color(c));
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const y0 = (z) => BANK.low * ((-z - edge) / (-BANK.slopeTo - edge)); // the slope's height at z
    let k = 0;
    spots.forEach(([x, z], i) => {
      const h = 2.6 + r() * 1.2;
      const y = y0(z);
      trunks.setMatrixAt(i, m4.compose(p.set(x, y, z), q.identity(), sc.set(1, h, 1)));
      paint.setMatrixAt(i, m4.compose(p.set(x, y, z), q.identity(), sc.set(1, 0.9, 1)));
      const g = greens[i % greens.length];
      for (let j = 0; j < 3; j++) {
        const s = 1.2 + r() * 0.6;
        m4.compose(
          p.set(x + (j - 1) * 1.0 + (r() - 0.5) * 0.4, y + h + 0.5 + r() * 0.6, z + (r() - 0.5) * 0.8),
          q.identity(),
          sc.set(s * 1.25, s * 0.85, s),
        );
        crowns.setMatrixAt(k, m4);
        crowns.setColorAt(k++, g);
      }
    });
    trunks.name = 'SlopeTrunks';
    paint.name = 'TrunkPaint';
    crowns.name = 'SlopeTrees';
    scene.add(trunks, paint, crowns);
  }
  return { root };
}

/** The sky behind the turned view (the front view looks down on the road and the river): blue above, hazy low. */
export const SKY = { haze: '#cfdde0' };
export function skyTexture() {
  const c = canvas(4, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6c9fd0');
  g.addColorStop(0.6, '#a9c8e0');
  g.addColorStop(1, SKY.haze);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft shadow under a body (a texture, so the vehicles sit on the road without real shadows too). One texture. */
let blobTex = null;
export function blobShadow(length, width, opacity = 0.42) {
  if (!blobTex) {
    const c = canvas(128, 128);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(20, 26, 34, 1)');
    g.addColorStop(0.6, 'rgba(20, 26, 34, 0.45)');
    g.addColorStop(1, 'rgba(20, 26, 34, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(c);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = 1;
  m.userData.noExport = true;
  m.name = 'BlobShadow';
  return m;
}
