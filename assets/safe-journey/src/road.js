// The road, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a two-lane highway
// on a river embankment, as so many of Bangladesh's highways run. Grey asphalt with worn wheel paths, white edge
// lines and a dashed centre line; shoulders of brick ballast; verges of dry grass. Beyond the far verge the embankment
// slopes down to a muddy bank, then the river (its water a cool teal, rippled). Beyond the near verge, harvested
// fields. Nothing else (only the main objects: no posts, boats, trees or houses). The arrows'
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
  // the near side, beyond the verge: harvested paddy fields, the stubble in rows, low earth ridges between the plots
  // (no props on the fields, the banks or the river: only the main objects)
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
