// The street round the road (procedural three.js, metres): a paved footpath with kerbs on both sides, compacted
// earth beyond, a brick boundary wall with plastered pillars on the far side, trees and street lamps behind it, a
// row of town houses, and an afternoon sky. Built once per path (the bend turns through the far side, so what
// stands in its way is left out). Everything is static, so it is merged: the textured surfaces share one kind of
// material (asphalt, pavers, earth, brick, house fronts) and the rest is one mesh coloured per vertex. Five draw
// calls per path and three shader programs in all; nothing here casts a shadow (only the car does, in a tight
// shadow box that follows it). The textures are drawn once on canvases with seeded noise.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { band, centreLine, ROAD_W } from './scene.js';

export const SKY_HAZE = '#e6dccb';
const KERB = { w: 0.2, h: 0.13 };
const WALK = 2.6; // m: the footpath's width
const WALL_Z = -(ROAD_W / 2 + KERB.w + WALK + 0.14); // the wall's middle line, just behind the far footpath
const HOUSES_Z = -9.2; // the houses' fronts
const FACADE = { w: 12, h: 13 }; // m: one house front in the texture (four bays, four floors and a parapet)

/** A seeded random number generator: the same street every time (tests compare pictures). */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d', { willReadFrequently: true }), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Grain on the whole canvas in one pass over its pixels: each pixel a little lighter or darker, and a few specks. */
function grain(ctx, w, h, rand, amount = 14, specks = 0.02) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let n = (rand() - 0.5) * amount;
    if (rand() < specks) n += (rand() < 0.5 ? -1 : 1) * amount * 2.5;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Soft blotches (worn or damp patches). */
function blotches(ctx, w, h, rand, n, dark, light, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rMin + rand() * (rMax - rMin));
    g.addColorStop(0, rand() < 0.5 ? dark : light);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Asphalt: dark grey with grains and a few worn patches (3 m square). */
export function asphaltTexture() {
  const rand = rng(7);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#434951';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rand, 12, 'rgba(20,24,30,0.14)', 'rgba(130,134,140,0.10)', 40, 120);
    grain(ctx, w, h, rand, 26, 0.05);
  });
}

/** Concrete pavers in a running bond, each a slightly different warm grey (2 m square). */
function paverTexture() {
  const rand = rng(11);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5b554d'; // the joints
    ctx.fillRect(0, 0, w, h);
    const tones = ['#8d867b', '#968f83', '#837c71', '#9c9487', '#8a8276'];
    const bw = 128;
    const bh = 64;
    for (let row = 0; row < h / bh; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col < w / bw + 1; col++) {
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; // a worn, lighter top edge
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, 3);
      }
    }
    grain(ctx, w, h, rand, 16, 0.03);
  });
}

/** Compacted earth with small stones (4 m square). */
function earthTexture() {
  const rand = rng(23);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8f7658';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rand, 26, 'rgba(70,52,34,0.22)', 'rgba(176,150,112,0.22)', 30, 100);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${150 + rand() * 60},${135 + rand() * 50},${110 + rand() * 40},0.8)`;
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, 1.5 + rand() * 3, 1 + rand() * 2, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    grain(ctx, w, h, rand, 22, 0.04);
  });
}

/** Red bricks in mortar for one wall panel (2.5 m × 1 m, both faces). */
function brickTexture() {
  const rand = rng(31);
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b7a58a';
    ctx.fillRect(0, 0, w, h);
    const rows = 13;
    const bh = h / rows;
    const bw = w / 11;
    for (let r = 0; r < rows; r++)
      for (let c = -1; c < 12; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0);
        const k = rand();
        ctx.fillStyle = `rgb(${Math.round(140 + k * 40)},${Math.round(62 + k * 22)},${Math.round(44 + k * 14)})`;
        ctx.fillRect(x + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    grain(ctx, w, h, rand, 14, 0.02);
  });
}

/** House fronts in four colours side by side: plaster, four bays of windows with frames, sills and balcony rails,
 *  floor bands and a parapet (each FACADE.w × FACADE.h). The top left corner is plain plaster, for the roofs. */
const HOUSE_COLOURS = ['#efd6a2', '#e7c0b0', '#cbdbe6', '#e3d7bd'];
function facadeTexture() {
  const rand = rng(41);
  return canvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      const vw = w / HOUSE_COLOURS.length;
      const floor = (h * 3) / FACADE.h; // 3 m a floor
      HOUSE_COLOURS.forEach((colour, v) => {
        const x0 = v * vw;
        ctx.fillStyle = colour;
        ctx.fillRect(x0, 0, vw, h);
        ctx.fillStyle = 'rgba(80,70,60,0.22)'; // the parapet's coping
        ctx.fillRect(x0, h - 4 * floor - 8, vw, 6);
        const bay = vw / 4;
        for (let f = 0; f < 4; f++) {
          const yFloor = h - (f + 1) * floor; // floor f from the ground up
          ctx.fillStyle = 'rgba(90,80,70,0.16)';
          ctx.fillRect(x0, yFloor + floor - 3, vw, 4);
          for (let b = 0; b < 4; b++) {
            const x = x0 + b * bay + bay * 0.2;
            const y = yFloor + floor * 0.2;
            const ww = bay * 0.6;
            const wh = floor * 0.5;
            ctx.fillStyle = 'rgba(60,50,40,0.35)'; // the reveal's shadow
            ctx.fillRect(x - 2, y - 2, ww + 4, wh + 5);
            const g = ctx.createLinearGradient(x, y, x + ww, y + wh);
            g.addColorStop(0, '#6a8ca6');
            g.addColorStop(0.5, '#33506a');
            g.addColorStop(1, '#243a4f');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, ww, wh);
            ctx.fillStyle = '#f4f1ea'; // frame and mullion
            ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
            ctx.strokeStyle = '#f4f1ea';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, ww, wh);
            ctx.fillStyle = 'rgba(70,60,50,0.5)'; // sill
            ctx.fillRect(x - 3, y + wh + 2, ww + 6, 3);
            if (f > 0 && rand() < 0.55) {
              ctx.strokeStyle = 'rgba(55,60,66,0.85)'; // balcony rail
              ctx.lineWidth = 1.5;
              const ry = y + wh * 0.6;
              ctx.strokeRect(x - 4, ry, ww + 8, wh * 0.4 + 5);
              for (let k = 1; k < 6; k++) {
                ctx.beginPath();
                ctx.moveTo(x - 4 + ((ww + 8) * k) / 6, ry);
                ctx.lineTo(x - 4 + ((ww + 8) * k) / 6, ry + wh * 0.4 + 5);
                ctx.stroke();
              }
            }
          }
        }
      });
      grain(ctx, w, h, rand, 10, 0.01);
    },
    false,
  );
}

/** The distance of a point (x, z) from a polyline of (x, z) points. */
function distanceTo(pts, x, z) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const dx = bx - ax;
    const dz = bz - az;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - ax - k * dx, z - az - k * dz));
  }
  return best;
}

/** World UVs (x, z ÷ size) for a flat or upright strip. */
function worldUV(geo, size) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) uv.set([(p.getX(i) + p.getY(i)) / size, p.getZ(i) / size], i * 2);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** An upright strip along a line of (x, z) points from y0 to y1, `offset` to the right of it, facing right (+1) or
 *  left (−1). */
function wallStrip(pts, offset, y0, y1, side) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l;
    const nz = (b[0] - a[0]) / l;
    const x = pts[i][0] + nx * offset;
    const z = pts[i][1] + nz * offset;
    pos.push(x, y0, z, x, y1, z);
    if (i) {
      const k = i * 2;
      if (side > 0) idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
      else idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Position, normal and uv only, never indexed (so that any parts merge), moved by m. */
function part(geo, m = null) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  if (m) g.applyMatrix4(m);
  return g;
}
// The street is unlit (MeshBasicMaterial: the cheapest pixels, which matters on a phone and in software
// rendering); its light is painted into the vertex colours instead, from the sun's side: tops brightest, faces
// towards the sun and the viewer a little darker, faces away darker still.
const SUN_DIR = new THREE.Vector3(-0.25, 0.9, 0.45).normalize();
/** Colours every vertex of g with `colour`, lit by its normal. */
function shade(g, colour) {
  const c = new THREE.Color(colour);
  const nrm = g.attributes.normal;
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const k = 0.6 + 0.42 * Math.max(0, v.fromBufferAttribute(nrm, i).dot(SUN_DIR));
    col.set([c.r * k, c.g * k, c.b * k], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
/** A part painted one colour (white for the textured ones), moved by m. */
const painted = (geo, colour = '#ffffff', m = null) => shade(part(geo, m), colour);

const Y = new THREE.Vector3(0, 1, 0);
const place = (x, y, z, ry = 0, s = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, ry), new THREE.Vector3(s, s, s));

/** Shared by both paths: the materials and the shapes. */
function sharedParts() {
  const textured = (name, map) => new THREE.MeshBasicMaterial({ name, map, vertexColors: true });
  const mats = {
    walk: textured('Footpath', paverTexture()),
    earth: textured('Earth', earthTexture()),
    brick: textured('BrickWall', brickTexture()),
    house: textured('Houses', facadeTexture()),
    painted: new THREE.MeshBasicMaterial({ name: 'StreetFurniture', vertexColors: true }),
  };
  const rand = rng(53);
  // a tree: a trunk and a crown of five lumpy, flat-shaded blobs
  const trunk = new THREE.CylinderGeometry(0.11, 0.17, 2.8, 7);
  trunk.translate(0, 1.4, 0);
  const blobs = [];
  for (const [x, y, z, r] of [
    [0, 3.4, 0, 1.25],
    [0.75, 3.0, 0.3, 0.9],
    [-0.7, 3.1, -0.2, 0.95],
    [0.1, 4.1, -0.3, 0.85],
    [-0.2, 2.9, 0.75, 0.8],
  ]) {
    const b = new THREE.IcosahedronGeometry(r, 1);
    const p = b.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setXYZ(i, p.getX(i) * (0.92 + rand() * 0.16), p.getY(i) * (0.85 + rand() * 0.15), p.getZ(i) * (0.92 + rand() * 0.16));
    b.translate(x, y, z);
    blobs.push(b);
  }
  const crown = mergeGeometries(blobs);
  crown.computeVertexNormals(); // not indexed: flat shaded, leafy
  // a street lamp: a grey pole on a base, an arm towards the road, a lamp head with a warm lens
  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const lamp = [
    [new THREE.CylinderGeometry(0.06, 0.09, 6, 8).translate(0, 3, 0), '#5d6670'],
    [new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8).translate(0, 0.25, 0), '#4a525b'],
    [box(0.06, 0.06, 1.3, 0, 5.9, 0.62), '#5d6670'],
    [box(0.28, 0.12, 0.6, 0, 5.86, 1.2), '#4a525b'],
    [box(0.22, 0.03, 0.5, 0, 5.795, 1.2), '#ffe9b8'],
  ];
  // a wall panel's plaster: the pillar at its start (with a cap) and the coping along its top
  const plaster = [box(0.36, 1.26, 0.34, -1.25, 0.63, 0), box(0.44, 0.07, 0.42, -1.25, 1.295, 0), box(2.5, 0.06, 0.28, 0, 1.03, 0)];
  // a brick panel, its uvs over both faces (the ends are hidden by the pillars)
  const panel = new THREE.BoxGeometry(2.5, 1.0, 0.2).translate(0, 0.5, 0);
  return { mats, trunk, crown, lamp, plaster, panel };
}

let shared = null;

/**
 * The street for one path: footpaths and kerbs follow the road; the wall, trees, lamps and houses stand only
 * where the road (and its footpath) is not. Returns a group to show with that path's road.
 */
export function createSetting(path) {
  shared ||= sharedParts();
  const { mats } = shared;
  const g = new THREE.Group();
  g.name = `Street_${path}`;
  g.userData.noExport = true;
  const pts = centreLine(path);
  const clear = (x, z, margin) => distanceTo(pts, x, z) > margin;
  const furniture = []; // painted parts, one mesh
  const bricks = [];

  // kerbs (their top and the face towards the road) and the footpaths behind them, at the kerb's height
  const walks = [];
  for (const side of [-1, 1]) {
    const edge = side * (ROAD_W / 2);
    furniture.push(painted(band(pts, KERB.w, KERB.h, edge + side * (KERB.w / 2)), '#a9a49b'));
    furniture.push(painted(wallStrip(pts, edge, 0, KERB.h, -side), '#8f8a82')); // facing the road
    walks.push(painted(worldUV(band(pts, WALK, KERB.h - 0.005, edge + side * (KERB.w + WALK / 2)), 2)));
    walks.push(painted(worldUV(wallStrip(pts, edge + side * (KERB.w + WALK), 0, KERB.h, side), 2))); // facing away
  }
  const walk = new THREE.Mesh(mergeGeometries(walks), mats.walk);
  walk.name = 'Footpaths';
  g.add(walk);

  // the boundary wall: 2.5 m panels of brick with a plastered pillar and coping, where the road is not
  const behind = -WALL_Z - 0.25; // how far from the road's middle the wall stands (less a little)
  for (let x = -40; x <= 50; x += 2.5) {
    if (![-1.3, 0, 1.3].every((dx) => clear(x + dx, WALL_Z, behind))) continue;
    const m = place(x, 0, WALL_Z);
    bricks.push(painted(shared.panel, '#ffffff', m));
    for (const p of shared.plaster) furniture.push(painted(p, '#e2d6bf', m));
  }

  // trees behind the wall, and street lamps on the far footpath (well away from the car's run)
  const rand = rng(path === 'turn' ? 67 : 61);
  const leaf = new THREE.Color();
  for (let x = -38; x <= 48; x += 5.5 + rand() * 2.5) {
    const z = WALL_Z - 1.6 - rand() * 1.0;
    const ry = rand() * Math.PI * 2;
    const s = 0.85 + rand() * 0.35;
    leaf.setHSL(0.24 + rand() * 0.06, 0.38 + rand() * 0.12, 0.3 + rand() * 0.08);
    if (!clear(x, z, behind + 1.2)) continue;
    const m = place(x, 0, z, ry, s);
    furniture.push(painted(shared.trunk, '#6a5140', m), painted(shared.crown, leaf.getHex(), m));
  }
  const lampZ = -(ROAD_W / 2 + KERB.w + 0.45);
  for (const x of [-15, 14.5, 27]) {
    if (!clear(x, lampZ, ROAD_W / 2 + 0.4)) continue;
    for (const [geo, colour] of shared.lamp) furniture.push(painted(geo, colour, place(x, 0, lampZ)));
  }

  // town houses: plastered fronts in warm colours with windows and balconies, three or four storeys
  const houses = [];
  const hr = rng(71);
  const variants = HOUSE_COLOURS.length;
  for (let x = -42; x < 52; ) {
    const w = 6 + Math.round(hr() * 4);
    const floors = 3 + Math.round(hr());
    const d = 8;
    const z = HOUSES_Z - hr() * 1.2;
    const v = Math.floor(hr() * variants);
    const ok = [0, 0.25, 0.5, 0.75, 1].every((k) => clear(x + k * w, z, behind + 1) && clear(x + k * w, z - d, behind + 1));
    if (ok) {
      const h = floors * 3 + 0.6;
      const b = new THREE.BoxGeometry(w, h, d).toNonIndexed().translate(x + w / 2, h / 2, z - d / 2);
      const p = b.attributes.position;
      const n = b.attributes.normal;
      const uv = b.attributes.uv;
      // within its colour's strip of the texture: across the front, or along the side; the roof is plain plaster
      const u = (along) => (v + Math.min(0.98, Math.max(0.02, along / FACADE.w))) / variants;
      for (let i = 0; i < p.count; i++) {
        if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, (v + 0.02) / variants, 0.995);
        else if (Math.abs(n.getZ(i)) > 0.5) uv.setXY(i, u(p.getX(i) - x), p.getY(i) / FACADE.h);
        else uv.setXY(i, u(z - p.getZ(i)), p.getY(i) / FACADE.h);
      }
      houses.push(shade(b, '#ffffff'));
    }
    x += w + 0.4;
  }
  const add = (list, material, name) => {
    if (!list.length) return;
    const mesh = new THREE.Mesh(mergeGeometries(list), material);
    mesh.name = name;
    g.add(mesh);
  };
  add(bricks, mats.brick, 'Wall');
  add(houses, mats.house, 'Houses');
  add(furniture, mats.painted, 'KerbsWallTreesLamps');
  return g;
}

/** The ground beyond the footpaths and the sky dome, shared by both paths. */
export function createSurroundings() {
  shared ||= sharedParts();
  const g = new THREE.Group();
  g.name = 'Surroundings';
  g.userData.noExport = true;
  const groundGeo = new THREE.CircleGeometry(300, 48);
  groundGeo.rotateX(-Math.PI / 2);
  shade(worldUV(groundGeo, 4), '#ffffff');
  const ground = new THREE.Mesh(groundGeo, shared.mats.earth);
  ground.name = 'Ground';
  ground.position.y = -0.01;
  ground.renderOrder = 8; // after the road, the footpaths and the houses: only the pixels left are drawn
  // the sky: deep blue overhead, paler towards a warm, hazy horizon (fog takes the far ground into it)
  const skyGeo = new THREE.SphereGeometry(380, 32, 16);
  const p = skyGeo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const top = new THREE.Color('#3f7cc0');
  const mid = new THREE.Color('#8fbbe0');
  const low = new THREE.Color(SKY_HAZE);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const k = p.getY(i) / 380;
    if (k > 0.25) c.lerpColors(mid, top, Math.min(1, (k - 0.25) / 0.6));
    else c.lerpColors(low, mid, Math.max(0, k / 0.25));
    col.set([c.r, c.g, c.b], i * 3);
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ name: 'Sky', vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.name = 'Sky';
  sky.renderOrder = 9; // last of all, where nothing else is
  g.add(ground, sky);
  return g;
}
