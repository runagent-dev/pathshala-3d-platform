// The apparatus, in centimetres, procedural three.js: the school's optical disc (a white disc with a printed degree scale,
// upright on a post and a foot), a semicircular glass block at its centre with its flat face up, a ray box clamped to the
// disc's rim that turns round the lower half, a clear semicircular cell that can sit on the flat face and fill with
// water, and a right-angle glass prism for চিত্র ৯.০৭. A light-sand table top under it, in the deep-blue backdrop.
// The point of incidence O is the origin; the disc's face is the plane z = 0; the light runs in the plane z = Z_RAY.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT } from '@shared/student/materials.js';
import { BLOCK, CELL, DISC, PRISM, SOURCE, Z_RAY } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
export const TABLE_Y = -(DISC.r + 4.2); // the table's top
const GLASS_Z = Z_RAY - BLOCK.thick / 2; // the back face of the block and the prism, just clear of the disc

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

/**
 * The printed face of the disc: degrees from the normal, 0 at the top and the bottom, 90 at the sides, a tick every
 * degree, longer every 5, a number every 10; the normal and the surface printed faintly. 1024² canvas, made once.
 */
function scaleTexture(num, renderer) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const m = S / 2;
  const k = m / DISC.r; // px per cm
  g.fillStyle = '#f6f3ea';
  g.fillRect(0, 0, S, S);
  // a dark band round the rim
  g.beginPath();
  g.arc(m, m, m - 1, 0, Math.PI * 2);
  g.lineWidth = 0.55 * k;
  g.strokeStyle = '#2a3442';
  g.stroke();
  const rOut = (DISC.r - 0.5) * k;
  g.strokeStyle = '#2a3442';
  g.lineCap = 'butt';
  for (let d = 0; d < 360; d++) {
    const a = (d * Math.PI) / 180;
    const len = d % 10 === 0 ? 0.95 : d % 5 === 0 ? 0.62 : 0.34;
    g.lineWidth = d % 10 === 0 ? 3.2 : d % 5 === 0 ? 2.4 : 1.5;
    const sx = Math.sin(a);
    const sy = -Math.cos(a);
    g.beginPath();
    g.moveTo(m + sx * rOut, m + sy * rOut);
    g.lineTo(m + sx * (rOut - len * k), m + sy * (rOut - len * k));
    g.stroke();
  }
  // the numbers: degrees from the nearest normal (0 at top and bottom, 90 at the sides)
  g.fillStyle = '#1f2a37';
  g.font = `700 ${Math.round(1.02 * k)}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const rNum = rOut - 1.85 * k;
  for (let d = 0; d < 360; d += 10) {
    const a = (d * Math.PI) / 180;
    const v = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d;
    g.save();
    g.translate(m + Math.sin(a) * rNum, m - Math.cos(a) * rNum);
    g.rotate(a);
    g.fillText(num(v), 0, 0);
    g.restore();
  }
  // the normal and the surface, printed faintly
  g.strokeStyle = 'rgba(42, 52, 66, 0.28)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(m, m - rOut + 1.2 * k);
  g.lineTo(m, m + rOut - 1.2 * k);
  g.moveTo(m - rOut + 1.2 * k, m);
  g.lineTo(m + rOut - 1.2 * k, m);
  g.stroke();
  // the centre ring
  g.beginPath();
  g.arc(m, m, 0.25 * k, 0, Math.PI * 2);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

/** Clear glass, two materials: the faces (pale, see-through) and the edges seen end-on (greener, as real glass looks). */
function glassMaterials() {
  const face = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#a9e3d2',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
    depthWrite: false,
  });
  const edge = new THREE.MeshPhysicalMaterial({
    name: 'GlassEdge',
    color: '#4f9e86',
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.2,
    depthWrite: false,
  });
  return [face, edge];
}

function extruded(shape, depth, bevel = 0.09) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 56,
  });
  geo.translate(0, 0, bevel);
  return geo;
}

/** A glass piece with a crisp outline (lines along its edges, in the green of thick glass). */
function glassPiece(name, geo, mats) {
  const g = new THREE.Group();
  g.name = name;
  const body = new THREE.Mesh(geo, mats);
  body.name = `${name}Body`;
  body.renderOrder = 4;
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 25),
    new THREE.LineBasicMaterial({ name: 'GlassLine', color: '#2a6f5b', transparent: true, opacity: 0.95 }),
  );
  lines.renderOrder = 5;
  lines.userData.noExport = true;
  g.add(body, lines);
  return { group: g, body, lines };
}

export function createApparatus({ renderer, num }) {
  const root = new THREE.Group();
  root.name = 'OpticalDisc';

  // ── the table: a rounded slab, light sand on top and a darker band round its edge (one draw) ──
  const slab = new THREE.ExtrudeGeometry(roundedRect(-30, 30, -14, 16, 3), {
    depth: 1.6,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 2,
    curveSegments: 6,
  })
    .rotateX(Math.PI / 2)
    .translate(0, TABLE_Y - 0.2, 0);
  slab.clearGroups();
  const sand = new THREE.Color('#c9b48d');
  const band = new THREE.Color('#8f7753');
  const n = slab.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) (n.getY(i) > 0.9 ? sand : band).toArray(tint, i * 3);
  slab.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const table = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.86 }));
  table.name = 'Table';
  table.receiveShadow = true;
  table.userData.noExport = true;
  root.add(table);

  // ── the disc on its post and foot ──
  const metal = new THREE.MeshStandardMaterial({ name: 'Anodised', color: '#2c333d', roughness: 0.42, metalness: 0.55 });
  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#b9c0c8', roughness: 0.32, metalness: 0.85 });
  const plastic = new THREE.MeshStandardMaterial({ name: 'DiscBody', color: '#e9e4d6', roughness: 0.6 });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(DISC.r, DISC.r, DISC.thick, 96, 1).rotateX(Math.PI / 2).translate(0, 0, -DISC.thick / 2 - 0.002),
    [new THREE.MeshStandardMaterial({ name: 'DiscRim', color: '#2a3442', roughness: 0.5 }), plastic, plastic],
  );
  body.name = 'Disc';
  body.castShadow = true;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(DISC.r, 96),
    new THREE.MeshStandardMaterial({ name: 'DiscScale', map: scaleTexture(num, renderer), roughness: 0.7 }),
  );
  face.name = 'DiscScale';
  face.position.z = 0.001;
  // the post behind the disc and the foot on the table (merged: one draw)
  const postH = -TABLE_Y - 0.6;
  const post = new THREE.BoxGeometry(1.8, postH, 1.2).translate(0, TABLE_Y + postH / 2, -DISC.thick - 0.6);
  const foot = new THREE.CylinderGeometry(5.2, 5.6, 1.1, 48).translate(0, TABLE_Y + 0.55, -1.6);
  const boss = new THREE.CylinderGeometry(1.1, 1.1, 1.3, 24).rotateX(Math.PI / 2).translate(0, 0, -DISC.thick - 0.65);
  const stand = new THREE.Mesh(mergeGeometries([post, foot, boss]), metal);
  stand.name = 'Stand';
  stand.castShadow = true;
  root.add(body, face, stand);

  // ── the semicircular block: flat face up through O, round side down ──
  const mats = glassMaterials();
  const half = new THREE.Shape();
  half.moveTo(-BLOCK.r, 0);
  half.lineTo(BLOCK.r, 0);
  half.absarc(0, 0, BLOCK.r, 0, Math.PI, true);
  const block = glassPiece('GlassBlock', extruded(half, BLOCK.thick), mats);
  block.group.position.z = GLASS_Z;
  // two small clips that hold it on the disc
  const clipGeo = mergeGeometries([
    new THREE.BoxGeometry(0.7, 0.5, BLOCK.thick + 0.3).translate(-BLOCK.r * 0.72, -BLOCK.r * 0.69 - 0.32, BLOCK.thick / 2),
    new THREE.BoxGeometry(0.7, 0.5, BLOCK.thick + 0.3).translate(BLOCK.r * 0.72, -BLOCK.r * 0.69 - 0.32, BLOCK.thick / 2),
  ]);
  const clips = new THREE.Mesh(clipGeo, metal);
  clips.name = 'Clips';
  block.group.add(clips);
  root.add(block.group);

  // ── the ray box on its arm, clamped to the rim: built pointing up from below O, turned about O ──
  const pivot = new THREE.Group();
  pivot.name = 'RayBox';
  const boxGeo = new THREE.BoxGeometry(2.2, SOURCE.len, 2.3).translate(0, -SOURCE.r, Z_RAY + 0.05);
  const arm = new THREE.BoxGeometry(0.9, DISC.r + 0.5 - SOURCE.r - SOURCE.len / 2 + 0.2, 0.5).translate(
    0,
    -(SOURCE.r + SOURCE.len / 2 + (DISC.r + 0.5 - SOURCE.r - SOURCE.len / 2) / 2),
    0.35,
  );
  const clamp = new THREE.BoxGeometry(1.6, 1.0, DISC.thick + 1.0).translate(0, -DISC.r - 0.25, -DISC.thick / 2 + 0.05);
  const knob = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 16).rotateX(Math.PI / 2).translate(0, -DISC.r - 0.25, 0.85);
  const rayBox = new THREE.Mesh(mergeGeometries([boxGeo, arm, clamp, knob]), metal);
  rayBox.castShadow = true;
  rayBox.name = 'RayBoxBody';
  // the slit plate at its inner end, the slit glowing warm
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 2.4).translate(0, -SOURCE.r + SOURCE.len / 2 + 0.09, Z_RAY + 0.05), steel);
  plate.name = 'SlitPlate';
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.2, 1.7).translate(0, -SOURCE.r + SOURCE.len / 2 + 0.1, Z_RAY + 0.05),
    new THREE.MeshBasicMaterial({ name: 'Slit', color: '#ffe8a3', toneMapped: false }),
  );
  slit.name = 'Slit';
  // vents on its side (a ray box, not a brick)
  const vents = [];
  for (let i = 0; i < 4; i++) vents.push(new THREE.BoxGeometry(1.5, 0.12, 0.06).translate(0, -SOURCE.r - 0.9 + i * 0.45, Z_RAY + 1.21));
  const vent = new THREE.Mesh(mergeGeometries(vents), new THREE.MeshStandardMaterial({ name: 'Vent', color: '#11151a', roughness: 0.8 }));
  vent.name = 'Vents';
  pivot.add(rayBox, plate, slit, vent);
  // a big invisible target for a finger
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, SOURCE.len + 2.6, 3.4).translate(0, -SOURCE.r, Z_RAY),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.name = 'RayBoxHit';
  hit.userData.noExport = true;
  pivot.add(hit);
  root.add(pivot);

  // ── the water cell: a clear half-round trough on the flat face (front and back plates, the round wall) ──
  const cell = new THREE.Group();
  cell.name = 'WaterCell';
  const plasticMat = new THREE.MeshPhysicalMaterial({
    name: 'CellPlastic',
    color: '#eef6ff',
    roughness: 0.05,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    envMapIntensity: 1.3,
  });
  const ring = new THREE.Shape();
  ring.moveTo(CELL.r + CELL.wall, 0);
  ring.absarc(0, 0, CELL.r + CELL.wall, 0, Math.PI, false);
  ring.lineTo(-CELL.r, 0);
  ring.absarc(0, 0, CELL.r, Math.PI, 0, true);
  ring.lineTo(CELL.r + CELL.wall, 0);
  const wall = new THREE.Mesh(extruded(ring, BLOCK.thick + 0.4, 0.04), [plasticMat, plasticMat]);
  wall.position.z = -0.2;
  wall.renderOrder = 6;
  const plateShape = new THREE.Shape();
  plateShape.moveTo(-CELL.r - CELL.wall, 0);
  plateShape.lineTo(CELL.r + CELL.wall, 0);
  plateShape.absarc(0, 0, CELL.r + CELL.wall, 0, Math.PI, false);
  const plateGeo = new THREE.ShapeGeometry(plateShape, 40);
  const front = new THREE.Mesh(plateGeo, plasticMat);
  front.position.z = BLOCK.thick + 0.2;
  front.renderOrder = 7;
  const cellLines = new THREE.LineSegments(
    mergeGeometries([new THREE.EdgesGeometry(wall.geometry, 30).translate(0, 0, -0.2)]),
    new THREE.LineBasicMaterial({ name: 'CellLine', color: '#9cc3e6', transparent: true, opacity: 0.9 }),
  );
  cellLines.userData.noExport = true;
  // the water: a half-round slab clipped at its level, and its top surface
  const level = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const waterMat = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    color: '#5aa9e6',
    roughness: 0.1,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    clippingPlanes: [level],
    envMapIntensity: 1.1,
  });
  const waterShape = new THREE.Shape();
  waterShape.moveTo(-CELL.r, 0);
  waterShape.lineTo(CELL.r, 0);
  waterShape.absarc(0, 0, CELL.r, 0, Math.PI, false);
  const water = new THREE.Mesh(extruded(waterShape, BLOCK.thick + 0.3, 0.02), [waterMat, waterMat]);
  water.name = 'Water';
  water.position.z = -0.15;
  water.renderOrder = 5;
  const surfaceMat = new THREE.MeshStandardMaterial({
    name: 'WaterTop',
    color: '#9fd0f5',
    transparent: true,
    opacity: 0.6,
    roughness: 0.15,
    depthWrite: false,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(1, BLOCK.thick + 0.3).rotateX(-Math.PI / 2).translate(0, 0, BLOCK.thick / 2), surfaceMat);
  surface.name = 'WaterTop';
  surface.renderOrder = 6;
  cell.add(water, surface, wall, front, cellLines);
  cell.position.z = GLASS_Z;
  root.add(cell);

  // ── the right-angle prism (চিত্র ৯.০৭): right angle at the lower right, its long face through O ──
  const h = PRISM.leg / 2;
  const tri = new THREE.Shape();
  tri.moveTo(-h, -h);
  tri.lineTo(h, -h);
  tri.lineTo(h, h);
  tri.lineTo(-h, -h);
  const prism = glassPiece('Prism', extruded(tri, BLOCK.thick, 0.07), mats);
  prism.group.position.z = GLASS_Z;
  const pclip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, BLOCK.thick + 0.3).translate(h - 1.2, -h - 0.3, BLOCK.thick / 2), metal);
  prism.group.add(pclip);
  root.add(prism.group);

  /** Where the pieces are: 0 in place, 1 away (lifted off toward the viewer and faded). */
  const fadeMats = [mats[0], mats[1], block.lines.material, clips.material];
  const base = new Map(fadeMats.map((m) => [m, m.opacity ?? 1]));
  const state = { theta: 30, cell: 0, water: 0, block: 1, prism: 0 };

  function setTheta(a) {
    state.theta = a;
    pivot.rotation.z = -THREE.MathUtils.degToRad(a);
  }
  /** The cell: k = 0 lifted away and hidden, 1 sitting on the flat face. */
  function setCell(k) {
    state.cell = k;
    cell.visible = k > 0.001;
    cell.position.y = (1 - k) * 7;
    const a = Math.min(1, k * 1.4);
    plasticMat.opacity = 0.18 * a;
    cellLines.material.opacity = 0.9 * a;
  }
  /** The water's level, 0…1 of the cell's height. */
  function setWater(k) {
    state.water = k;
    const y = k * CELL.r;
    level.constant = y + cell.position.y + 1e-4; // the plane: keep y ≤ level (world y; the cell is at x = z = 0)
    water.visible = k > 0.002 && cell.visible;
    surface.visible = water.visible && k < 0.995;
    const w = 2 * Math.sqrt(Math.max(0, CELL.r * CELL.r - y * y));
    surface.scale.x = Math.max(0.001, w);
    surface.position.y = y;
  }
  /** The block (b) and the prism (p): 1 on the disc, 0 away. */
  function setPieces(b, p) {
    state.block = b;
    state.prism = p;
    block.group.visible = b > 0.001;
    block.group.position.set(-(1 - b) * 9, 0, GLASS_Z + (1 - b) * 6);
    prism.group.visible = p > 0.001;
    prism.group.position.set((1 - p) * 9, 0, GLASS_Z + (1 - p) * 6);
    // both share the glass's materials: fade by whichever is moving
    const k = Math.max(b, p);
    for (const m of fadeMats) m.opacity = base.get(m) * Math.min(1, k * 1.25);
    prism.lines.material.opacity = 0.85 * Math.min(1, p * 1.25);
  }
  // the cell's clipping follows its own height
  const syncLevel = () => setWater(state.water);

  setTheta(state.theta);
  setCell(0);
  setWater(0);
  setPieces(1, 0);

  return {
    root,
    table,
    disc: face,
    pivot,
    hit,
    block: block.group,
    blockBody: block.body,
    prism: prism.group,
    cell,
    water,
    waterMat,
    state,
    later: [cell, prism.group, water, surface],
    setTheta,
    setCell: (k) => {
      setCell(k);
      syncLevel();
    },
    setWater,
    setPieces,
  };
}
