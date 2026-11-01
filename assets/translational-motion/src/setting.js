// The street round the road (procedural three.js, metres): a plain footpath with kerbs on both sides, compacted
// earth beyond and a soft afternoon sky, nothing else (the owner: only the main object, big). Everything is static
// and merged; nothing here casts a shadow (only the car does, in a tight shadow box that follows it).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { band, centreLine, ROAD_W } from './scene.js';

export const SKY_HAZE = '#e6dccb';
const KERB = { w: 0.2, h: 0.13 };
const WALK = 2.6; // m: the footpath's width

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

/** Compacted earth with small stones (4 m square). */
function earthTexture() {
  const rand = rng(23);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#cdbb9f'; // soft warm earth, calm
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, rand, 18, 'rgba(120,96,66,0.08)', 'rgba(240,228,206,0.12)', 30, 100);
    grain(ctx, w, h, rand, 10, 0.02);
  });
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

/** Shared by both paths: the materials and the shapes. */
function sharedParts() {
  const textured = (name, map) => new THREE.MeshBasicMaterial({ name, map, vertexColors: true });
  const mats = {
    walk: new THREE.MeshBasicMaterial({ name: 'Footpath', color: '#d6cdbf', vertexColors: true }), // plain, calm
    earth: textured('Earth', earthTexture()),
    painted: new THREE.MeshBasicMaterial({ name: 'StreetFurniture', vertexColors: true }),
  };
  return { mats };
}

let shared = null;

/**
 * The street for one path: footpaths and kerbs follow the road, nothing else. Returns a group to show with that
 * path's road.
 */
export function createSetting(path) {
  shared ||= sharedParts();
  const { mats } = shared;
  const g = new THREE.Group();
  g.name = `Street_${path}`;
  g.userData.noExport = true;
  const pts = centreLine(path);
  const furniture = []; // painted parts, one mesh

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

  // nothing beyond the footpaths: no wall, trees, lamps or houses (the owner: only the main object, big)
  const add = (list, material, name) => {
    if (!list.length) return;
    const mesh = new THREE.Mesh(mergeGeometries(list), material);
    mesh.name = name;
    g.add(mesh);
  };
  add(furniture, mats.painted, 'Kerbs');
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
  const top = new THREE.Color('#8eaecf');
  const mid = new THREE.Color('#bdd0e1');
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
