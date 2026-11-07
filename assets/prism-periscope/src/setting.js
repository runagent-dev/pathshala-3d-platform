// The setting, in centimetres: a calm deep-blue backdrop (a gradient, as the chapter's sister figures), a plain table
// top in light sand, a low brick wall standing on it, and a flower in a pot behind the wall: the thing to be seen.
// Nothing else. Static parts are merged, one mesh per material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SCENE } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
/** The table top (cm): it runs under the wall, the periscope and the binoculars, with blue round it. */
export const TABLE = { x0: -44, x1: 44, z0: -22, z1: 28 };

/** The backdrop: a vertical gradient (a power-of-two canvas, made once). */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRect(x0, x1, y0, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** The table: a rounded slab, light sand on top and a darker band round its edge (one draw, vertex colours). */
function table() {
  const { x0, x1, z0, z1 } = TABLE;
  const geo = new THREE.ExtrudeGeometry(roundedRect(x0, x1, -z1, -z0, 4), {
    depth: 2.4,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 2,
    curveSegments: 6,
  })
    .rotateX(Math.PI / 2)
    .translate(0, -0.3, 0);
  geo.clearGroups();
  const sand = new THREE.Color('#cdb891');
  const band = new THREE.Color('#8f7753');
  const n = geo.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) (n.getY(i) > 0.9 ? sand : band).toArray(tint, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.86 }));
  mesh.name = 'Table';
  mesh.receiveShadow = true;
  mesh.userData.noExport = true;
  return mesh;
}

/** Bricks in a stretcher bond with light mortar, a few shades of baked clay (512 × 256, made once). */
function brickTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#d9cfc0';
  g.fillRect(0, 0, W, H);
  const rows = 8;
  const cols = 4;
  const bh = H / rows;
  const bw = W / cols;
  const m = 5; // mortar, px
  const shades = ['#a4482f', '#b0553a', '#9a4129', '#b8613f', '#a94f35', '#97452e'];
  let k = 7;
  const rnd = () => {
    k = (k * 9301 + 49297) % 233280;
    return k / 233280;
  };
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let i = -1; i <= cols; i++) {
      const x = i * bw + off;
      g.fillStyle = shades[Math.floor(rnd() * shades.length)];
      g.fillRect(x + m / 2, r * bh + m / 2, bw - m, bh - m);
      // a faint lighter top edge and a darker bottom: the brick's face catches the light
      g.fillStyle = 'rgba(255, 230, 210, 0.12)';
      g.fillRect(x + m / 2, r * bh + m / 2, bw - m, 3);
      g.fillStyle = 'rgba(40, 10, 0, 0.16)';
      g.fillRect(x + m / 2, r * bh + bh - m / 2 - 3, bw - m, 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** A box's faces mapped so one texture repeat covers `tile` cm across and `tileY` cm up, on every side. */
function brickBox(w, h, d, tile, tileY) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + w / 2;
    const y = pos.getY(i);
    const z = pos.getZ(i) + d / 2;
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    if (ay > 0.5) uv.setXY(i, x / tile, z / tile);
    else if (ax > 0.5) uv.setXY(i, z / tile, y / tileY);
    else uv.setXY(i, x / tile, y / tileY);
  }
  return geo;
}

/** The low wall: bricks under a pale concrete coping. */
function wall() {
  const { x0, x1, top, z } = SCENE.wall;
  const g = new THREE.Group();
  g.name = 'Wall';
  const w = x1 - x0;
  const capH = 1.2;
  const body = new THREE.Mesh(
    brickBox(w, top - capH, 2 * z, 22, 9).translate((x0 + x1) / 2, (top - capH) / 2, 0),
    new THREE.MeshStandardMaterial({ name: 'Brick', map: brickTexture(), roughness: 0.92 }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w + 1.2, capH, 2 * z + 1.2).translate((x0 + x1) / 2, top - capH / 2, 0),
    new THREE.MeshStandardMaterial({ name: 'Coping', color: '#c3c0b8', roughness: 0.85 }),
  );
  cap.castShadow = true;
  cap.receiveShadow = true;
  g.add(body, cap);
  return g;
}

/** The flower in its pot: a terracotta pot, a stem with two leaves, and a pink head facing the periscope (+x). */
function flower() {
  const { x, y, r } = SCENE.flower;
  const g = new THREE.Group();
  g.name = 'Flower';
  const potH = 7.5;
  // the pot: a lathe, with a rolled rim and the soil inside
  const prof = [
    [0, 0],
    [3.2, 0],
    [3.35, 0.4],
    [4.2, potH - 1.4],
    [4.75, potH - 1.3],
    [4.85, potH - 0.7],
    [4.7, potH],
    [4.2, potH],
    [4.05, potH - 0.6],
    [0, potH - 0.6],
  ].map(([a, b]) => new THREE.Vector2(a, b));
  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 32).translate(x, 0, 0),
    new THREE.MeshStandardMaterial({ name: 'Terracotta', color: '#b6623d', roughness: 0.8 }),
  );
  pot.castShadow = true;
  pot.receiveShadow = true;
  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(4.05, 28).rotateX(-Math.PI / 2).translate(x, potH - 0.62, 0),
    new THREE.MeshStandardMaterial({ name: 'Soil', color: '#4a3324', roughness: 1 }),
  );
  // the stem, curving a little toward the light, and two leaves: one green mesh
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, potH - 0.6, 0),
    new THREE.Vector3(x - 0.3, potH + 6, 0.3),
    new THREE.Vector3(x + 0.2, y - 8, -0.2),
    new THREE.Vector3(x + 0.6, y - 0.6, 0),
  ]);
  const stem = new THREE.TubeGeometry(stemCurve, 24, 0.32, 6, false);
  const leaf = (at, ang, flip) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(2.2, 1.5, 5.2, 0);
    s.quadraticCurveTo(2.2, -1.5, 0, 0);
    const lg = new THREE.ShapeGeometry(s, 8);
    // a gentle fold along the middle vein
    const p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, -Math.abs(p.getY(i)) * 0.45);
    lg.rotateX(Math.PI / 2 - 0.4);
    lg.rotateY(ang);
    if (flip) lg.scale(-1, 1, 1);
    const pt = stemCurve.getPoint(at);
    return lg.translate(pt.x, pt.y, pt.z);
  };
  const green = new THREE.Mesh(
    mergeGeometries([stem, leaf(0.35, 0.5, false), leaf(0.55, -2.4, false)]),
    new THREE.MeshStandardMaterial({ name: 'Leaf', color: '#3f8f3a', roughness: 0.7, side: THREE.DoubleSide }),
  );
  green.castShadow = true;
  // the head: twelve petals round a yellow centre, in the plane facing +x
  const petals = [];
  const petal = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const ring = i % 2 ? 0.92 : 1;
    const p = petal
      .clone()
      .scale(0.42, r * 0.36, r * 0.2)
      .translate(0, r * 0.55 * ring, 0)
      .rotateX(a)
      .rotateZ(i % 2 ? 0.12 : 0.04);
    petals.push(p);
  }
  const head = new THREE.Mesh(
    mergeGeometries(petals).translate(x + 0.6, y, 0),
    new THREE.MeshStandardMaterial({ name: 'Petal', color: '#e8598f', roughness: 0.55 }),
  );
  head.castShadow = true;
  const centre = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.3, 16, 10).scale(0.6, 1, 1).translate(x + 0.9, y, 0),
    new THREE.MeshStandardMaterial({ name: 'FlowerCentre', color: '#f2c230', roughness: 0.7 }),
  );
  g.add(pot, soil, green, head, centre);
  return g;
}

export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  const tableMesh = table();
  const wallGroup = wall();
  const flowerGroup = flower();
  root.add(tableMesh, wallGroup, flowerGroup);
  return { root, table: tableMesh, wall: wallGroup, flower: flowerGroup };
}
