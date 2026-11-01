// The setting, in metres, drawn with small canvas pictures (no image files): the tiled courtyard of a house, the place
// of the book's দারোয়ান. Behind the floor a boundary wall in teal plaster over a darker dado, cream pillars with caps,
// an iron gate between two pillars with globe lamps, the guard's wooden stool beside it, flower pots at the foot of the
// wall; over the wall the town: four houses with windows and black water tanks on their roofs, trees between them;
// a morning sky with soft clouds over hazy ground.
// The orange F reads on the teal wall and the blue sky (no green or white behind it). Everything is still: merged into
// one mesh per material (src/merge.js, or by hand for the houses), never exported to the GLB, and none of it casts or
// receives a shadow (the sun's shadows fall on the courtyard floor, which is the floor's own).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boxProjectUV } from '@shared/student/materials.js';
import { FLOOR } from './floor.js';
import { mergeStatic } from './merge.js';

const WALL = { z: FLOOR.z0, thick: 0.22, high: 2.1, x0: -10, x1: 14 }; // the boundary wall's front face at z
const GATE = { x0: -4.4, x1: -1.6 }; // the gate pillars' centres
const PILLAR = 0.44;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')) };
}
function rand(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function texture(c, { repeat = false, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** A soft round blob drawn twice across the seam, so the picture tiles left to right. */
function blob(ctx, W, x, y, r, color) {
  for (const dx of [0, -W, W]) {
    const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g;
    ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
  }
}

/** The boundary wall's plaster: 4 m × 2.1 m, teal distemper, a darker dado with a cream line, rain streaks. */
function wallTexture() {
  const W = 512;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = rand(19);
  const dado = H * (1 - 0.62 / WALL.high);
  const g = ctx.createLinearGradient(0, 0, 0, dado);
  g.addColorStop(0, '#3a9aa3');
  g.addColorStop(1, '#2c838d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, dado);
  for (let i = 0; i < 420; i++) {
    const light = r() < 0.5;
    blob(ctx, W, r() * W, r() * dado, 4 + r() * 16, light ? `rgba(120,200,206,${0.05 + r() * 0.07})` : `rgba(18,70,78,${0.05 + r() * 0.07})`);
  }
  // rain streaks down from the coping
  for (let i = 0; i < 26; i++) {
    const x = r() * W;
    const s = ctx.createLinearGradient(0, 0, 0, 40 + r() * 70);
    s.addColorStop(0, 'rgba(20,55,60,0.22)');
    s.addColorStop(1, 'rgba(20,55,60,0)');
    ctx.fillStyle = s;
    ctx.fillRect(x, 0, 2 + r() * 5, 110);
  }
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '15,60,66' : '170,225,228'},${0.05 + r() * 0.08})`;
    ctx.fillRect(r() * W, r() * dado, 1, 1);
  }
  // the dado: darker oil paint, scuffed, splashes of dust near the floor
  ctx.fillStyle = '#1d5d66';
  ctx.fillRect(0, dado, W, H - dado);
  for (let i = 0; i < 160; i++)
    blob(
      ctx,
      W,
      r() * W,
      dado + r() * (H - dado),
      3 + r() * 9,
      r() < 0.6 ? `rgba(160,130,90,${0.08 + r() * 0.1})` : `rgba(10,40,45,${0.1 + r() * 0.1})`,
    );
  const dust = ctx.createLinearGradient(0, H - 14, 0, H);
  dust.addColorStop(0, 'rgba(170,140,100,0)');
  dust.addColorStop(1, 'rgba(170,140,100,0.45)');
  ctx.fillStyle = dust;
  ctx.fillRect(0, H - 14, W, 14);
  ctx.fillStyle = '#efe2c4';
  ctx.fillRect(0, dado - 3, W, 4);
  return texture(c, { repeat: true });
}

/** A house front, one storey and one bay (3 m × 3 m): plaster, a window with a sunshade, a floor band. */
function facadeTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = rand(7);
  ctx.fillStyle = '#f2ece0';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 200; i++)
    blob(ctx, S, r() * S, r() * S, 4 + r() * 14, `rgba(${r() < 0.5 ? '120,105,85' : '255,255,250'},${0.05 + r() * 0.06})`);
  const px = S / 3;
  // the floor band at the bottom
  ctx.fillStyle = '#d9cfbd';
  ctx.fillRect(0, S - 0.22 * px, S, 0.22 * px);
  // the window: frame, glass, bars, sill, sunshade (with its shadow)
  const wx = 0.85 * px;
  const wy = 0.75 * px;
  const ww = 1.3 * px;
  const wh = 1.35 * px;
  ctx.fillStyle = 'rgba(60,50,40,0.25)';
  ctx.fillRect(wx - 6, wy - 4, ww + 12, 18);
  ctx.fillStyle = '#fbf8f0';
  ctx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
  const glass = ctx.createLinearGradient(0, wy, 0, wy + wh);
  glass.addColorStop(0, '#2f4252');
  glass.addColorStop(1, '#4d6474');
  ctx.fillStyle = glass;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = 'rgba(200,225,240,0.25)';
  ctx.fillRect(wx + 4, wy + 4, ww * 0.3, wh - 8);
  ctx.fillStyle = '#3d6b5a'; // green-painted window bars
  for (let i = 1; i < 6; i++) ctx.fillRect(wx + (i * ww) / 6 - 1.5, wy, 3, wh);
  ctx.fillRect(wx, wy + wh / 2 - 1.5, ww, 3);
  ctx.fillStyle = '#cfc4b0';
  ctx.fillRect(wx - 8, wy - 12, ww + 16, 8); // the sunshade
  ctx.fillRect(wx - 6, wy + wh + 4, ww + 12, 5); // the sill
  // stains under the sill
  for (let i = 0; i < 5; i++) {
    const s = ctx.createLinearGradient(0, wy + wh + 9, 0, wy + wh + 40);
    s.addColorStop(0, 'rgba(90,80,60,0.16)');
    s.addColorStop(1, 'rgba(90,80,60,0)');
    ctx.fillStyle = s;
    ctx.fillRect(wx + r() * ww, wy + wh + 9, 3 + r() * 4, 32);
  }
  return texture(c, { repeat: true });
}

/** The sky dome's picture: deep blue overhead to a pale haze at the horizon, soft clouds, warm hazy ground below. */
function skyTexture() {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = rand(3);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d58b0');
  g.addColorStop(0.3, '#3f86d2');
  g.addColorStop(0.45, '#9cc8ec');
  g.addColorStop(0.5, '#e2eef2');
  g.addColorStop(0.52, '#d8cdb4');
  g.addColorStop(1, '#bba882');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // clouds: clusters of soft puffs in a band above the horizon, flat-bottomed
  for (let k = 0; k < 22; k++) {
    const cx = r() * W;
    const cy = H * (0.2 + r() * 0.24);
    const size = 14 + r() * 26;
    for (let i = 0; i < 9; i++) {
      const x = cx + (r() - 0.5) * size * 4;
      const y = cy + (r() - 0.7) * size * 0.9;
      blob(ctx, W, x, y, size * (0.6 + r() * 0.7), `rgba(255,255,255,${0.35 + r() * 0.3})`);
    }
    blob(ctx, W, cx, cy + size * 0.35, size * 1.4, 'rgba(160,185,210,0.18)');
  }
  return texture(c, { aniso: 1 });
}

/** A box from x0..x1, y0..y1, z0..z1 (a geometry already in place). */
function boxAt(x0, x1, y0, y1, z0, z1) {
  return new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
function meshOf(geo, material, name) {
  const m = new THREE.Mesh(geo, material);
  m.name = name;
  return m;
}

/** The houses over the wall: one mesh, the facade picture tinted per house (vertex colours), plain roofs. */
function houses() {
  const list = [
    // x0, x1, height, z (front), depth, colour
    [-11, -4.6, 6.2, -8.6, 5, '#f0d98c'],
    [-3.6, 1.4, 4.4, -10.4, 4, '#efb7a1'],
    [5.2, 10.6, 7.4, -9.2, 5, '#b9d2dc'],
    [11.4, 16, 5.2, -8.2, 4, '#e8c9e0'],
  ];
  const geos = [];
  const tint = new THREE.Color();
  for (const [x0, x1, h, z, d, color] of list) {
    tint.set(color);
    const body = boxProjectUV(boxAt(x0, x1, 0, h, z - d, z));
    const parapet = boxProjectUV(boxAt(x0 - 0.05, x1 + 0.05, h, h + 0.5, z - d - 0.05, z + 0.05));
    for (const g of [body, parapet]) {
      const n = g.attributes.normal;
      const uv = g.attributes.uv;
      const col = new Float32Array(n.count * 3);
      for (let i = 0; i < n.count; i++) {
        tint.toArray(col, i * 3);
        if (Math.abs(n.getY(i)) > 0.5 || g === parapet) uv.setXY(i, 0.3, 2.95); // roofs and the parapet: plain plaster
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geos.push(g);
    }
  }
  const map = facadeTexture();
  map.repeat.set(1 / 3, 1 / 3);
  const material = new THREE.MeshStandardMaterial({ name: 'Houses', map, vertexColors: true, roughness: 0.92, metalness: 0 });
  const mesh = meshOf(mergeGeometries(geos, false), material, 'Houses');
  for (const g of geos) g.dispose();
  return { mesh, list };
}

export function createScenery() {
  const root = new THREE.Group();
  root.name = 'Courtyard';
  root.userData.noExport = true;
  const mat = (name, color, roughness = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0, ...extra });
  const M = {
    plaster: mat('CreamPlaster', '#efe2c4', 0.92),
    iron: mat('Iron', '#262a2f', 0.5, { metalness: 0.45 }),
    wood: mat('Wood', '#8a5a2b', 0.8),
    leaves: mat('Leaves', '#2f6b35', 0.85, { flatShading: true }),
    pot: mat('Terracotta', '#b5562f', 0.85),
    flower: mat('Flowers', '#d6338a', 0.7),
    lamp: mat('LampGlobe', '#fff6dc', 0.35, { emissive: '#ffe9b0', emissiveIntensity: 0.35 }),
  };

  // the sky and the ground beyond the courtyard
  const sky = meshOf(
    new THREE.SphereGeometry(58, 32, 16),
    new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
    'Sky',
  );
  sky.position.set(2, 0, 0);
  sky.renderOrder = -1;
  const ground = meshOf(new THREE.PlaneGeometry(140, 140).rotateX(-Math.PI / 2), mat('Ground', '#b39d76', 1), 'Ground');
  ground.position.set(2, -0.012, 0);
  root.add(sky, ground);

  const still = new THREE.Group();
  still.name = 'CourtyardStill';
  root.add(still);

  // the boundary wall: teal plaster in two runs either side of the gate, a cream coping on top
  const wallMap = wallTexture();
  wallMap.repeat.set(1 / 4, 1 / WALL.high);
  const teal = mat('TealWall', '#ffffff', 0.95, { map: wallMap });
  const zc = WALL.z - WALL.thick / 2;
  for (const [a, b] of [
    [WALL.x0, GATE.x0 - PILLAR / 2],
    [GATE.x1 + PILLAR / 2, WALL.x1],
  ]) {
    still.add(meshOf(boxProjectUV(boxAt(a, b, 0, WALL.high, zc - WALL.thick / 2, zc + WALL.thick / 2)), teal, 'BoundaryWall'));
    still.add(meshOf(boxAt(a, b, WALL.high, WALL.high + 0.07, zc - 0.16, zc + 0.16), M.plaster, 'Coping'));
  }
  // pillars every three metres, bigger ones at the gate with a cap and a globe lamp
  const pillar = (x, big) => {
    const w = big ? PILLAR + 0.08 : PILLAR;
    const h = big ? 2.55 : 2.32;
    still.add(meshOf(boxAt(x - w / 2, x + w / 2, 0, h, zc - w / 2, zc + w / 2), M.plaster, 'Pillar'));
    still.add(meshOf(boxAt(x - w / 2 - 0.05, x + w / 2 + 0.05, h, h + 0.08, zc - w / 2 - 0.05, zc + w / 2 + 0.05), M.plaster, 'PillarCap'));
    if (big) {
      const globe = meshOf(new THREE.SphereGeometry(0.13, 20, 12), M.lamp, 'Lamp');
      globe.position.set(x, h + 0.24, zc);
      const stem = meshOf(new THREE.CylinderGeometry(0.03, 0.05, 0.12, 10), M.iron, 'LampStem');
      stem.position.set(x, h + 0.14, zc);
      still.add(globe, stem);
    }
  };
  for (const x of [-9.8, -7.3, 1.4, 5.2, 8.2, 11.2, 14.2]) pillar(x, false);
  pillar(GATE.x0, true);
  pillar(GATE.x1, true);

  // the iron gate: two leaves of round bars with spear tips between rails, closed
  const g0 = GATE.x0 + (PILLAR + 0.08) / 2 + 0.02;
  const g1 = GATE.x1 - (PILLAR + 0.08) / 2 - 0.02;
  const bar = new THREE.CylinderGeometry(0.011, 0.011, 1.86, 6);
  const tip = new THREE.ConeGeometry(0.026, 0.09, 6);
  for (const [a, b] of [
    [g0, (g0 + g1) / 2 - 0.01],
    [(g0 + g1) / 2 + 0.01, g1],
  ]) {
    for (const y of [0.1, 0.95, 1.78]) still.add(meshOf(boxAt(a, b, y - 0.025, y + 0.025, zc - 0.02, zc + 0.02), M.iron, 'GateRail'));
    for (const x of [a + 0.02, b - 0.02]) still.add(meshOf(boxAt(x - 0.02, x + 0.02, 0.05, 1.86, zc - 0.02, zc + 0.02), M.iron, 'GateStile'));
    const n = Math.round((b - a) / 0.11);
    for (let i = 1; i < n; i++) {
      const x = a + ((b - a) * i) / n;
      const rod = meshOf(bar, M.iron, 'GateBar');
      rod.position.set(x, 0.05 + 0.93, zc);
      const spear = meshOf(tip, M.iron, 'GateTip');
      spear.position.set(x, 1.95, zc);
      still.add(rod, spear);
    }
  }

  // the guard's stool beside the gate
  const stool = new THREE.Group();
  stool.position.set(GATE.x1 + 0.62, 0, WALL.z + 0.32);
  stool.rotation.y = 0.25;
  stool.add(meshOf(boxAt(-0.18, 0.18, 0.43, 0.47, -0.18, 0.18), M.wood, 'StoolSeat'));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = meshOf(new THREE.BoxGeometry(0.035, 0.44, 0.035), M.wood, 'StoolLeg');
      leg.position.set(sx * 0.14, 0.215, sz * 0.14);
      leg.rotation.set(sz * 0.06, 0, -sx * 0.06);
      stool.add(leg);
    }
  for (const sz of [-1, 1]) stool.add(meshOf(boxAt(-0.14, 0.14, 0.14, 0.17, sz * 0.14 - 0.012, sz * 0.14 + 0.012), M.wood, 'StoolRail'));
  still.add(stool);

  // flower pots along the foot of the wall
  const potGeo = new THREE.LatheGeometry(
    [
      [0.0, 0.0],
      [0.12, 0.0],
      [0.15, 0.24],
      [0.18, 0.27],
      [0.18, 0.31],
      [0.15, 0.31],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    16,
  );
  const leafGeo = new THREE.IcosahedronGeometry(0.16, 1);
  const flowerGeo = new THREE.IcosahedronGeometry(0.035, 0);
  const r = rand(41);
  for (const x of [-8.6, -6.0, 0.6, 3.7, 6.7, 9.7, 12.7]) {
    const z = WALL.z + 0.3;
    const pot = meshOf(potGeo, M.pot, 'Pot');
    pot.position.set(x, 0, z);
    still.add(pot);
    for (let i = 0; i < 3; i++) {
      const leaf = meshOf(leafGeo, M.leaves, 'Plant');
      leaf.position.set(x + (i - 1) * 0.1, 0.38 + (i === 1 ? 0.1 : 0), z + (r() - 0.5) * 0.08);
      leaf.scale.set(1, 0.85 + r() * 0.3, 1);
      still.add(leaf);
    }
    for (let i = 0; i < 7; i++) {
      const f = meshOf(flowerGeo, M.flower, 'Flower');
      const a = r() * Math.PI * 2;
      f.position.set(x + Math.cos(a) * 0.17, 0.4 + r() * 0.22, z + Math.sin(a) * 0.12 + 0.06);
      still.add(f);
    }
  }

  // over the wall: the houses (water tanks on their roofs) and trees between them
  const town = houses();
  root.add(town.mesh);
  const tankGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.95, 20);
  for (const [x0, x1, h, z, d] of town.list) {
    const tank = meshOf(tankGeo, M.iron, 'WaterTank');
    tank.position.set(x0 + (x1 - x0) * 0.3, h + 0.5 + 0.475, z - d * 0.5);
    still.add(tank);
  }
  const crown = new THREE.IcosahedronGeometry(1, 1);
  const trunk = new THREE.CylinderGeometry(0.11, 0.16, 1, 8);
  for (const [x, z, h, s] of [
    [-4.1, -6.2, 3.6, 1.25],
    [2.9, -7.3, 4.2, 1.5],
    [4.6, -5.9, 3.2, 1.1],
    [11.0, -6.6, 3.8, 1.3],
    [-9.6, -6.0, 3.4, 1.2],
  ]) {
    const t = meshOf(trunk, M.wood, 'Trunk');
    t.scale.set(1, h, 1);
    t.position.set(x, h / 2, z);
    still.add(t);
    for (const [dx, dy, dz, k] of [
      [0, 0.15, 0, 1],
      [-0.55, -0.35, 0.2, 0.75],
      [0.6, -0.25, -0.15, 0.8],
      [0.1, 0.75, -0.1, 0.7],
    ]) {
      const c = meshOf(crown, M.leaves, 'TreeCrown');
      c.scale.set(s * k * 1.1, s * k * 0.9, s * k);
      c.position.set(x + dx * s, h + dy * s, z + dz * s);
      still.add(c);
    }
  }

  mergeStatic(still);
  return { root, sky };
}
