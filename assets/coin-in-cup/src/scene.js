// The setting and the things on the table, in centimetres (reading.js has the sizes). A calm deep-blue backdrop and a
// plain sand-coloured table top that sits in it; on it only what the activity needs: a wide glazed tea cup with a coin on
// its bottom, the water poured into it, and the steel jug that pours it. The cup is cut through its axis for the
// picture: the front half (whole at first, as on a real table) fades away so the inside and the light in it can be seen;
// the cut face shows the unglazed body of the cup. The water is a translucent surface and its cut face; both follow the
// level without new geometry (the surface is scaled, the cut face's few vertices are moved in place).
import * as THREE from 'three';
import { COIN, CUP, innerRadius, LEVEL, ZP } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
const V2 = (x, y) => new THREE.Vector2(x, y);

/** The backdrop: a vertical gradient (a small power-of-two canvas, made once), used as scene.background. */
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

/** The table top: a finite rounded slab, light sand on top and a darker band round its edge (one draw). */
export const TABLE = { x0: -24, x1: 20, z0: -13, z1: 13, r: 3, th: 2.2 };
function createTable() {
  const s = new THREE.Shape();
  const { x0, x1, z0, z1, r } = TABLE;
  s.moveTo(x0 + r, z0);
  s.lineTo(x1 - r, z0);
  s.quadraticCurveTo(x1, z0, x1, z0 + r);
  s.lineTo(x1, z1 - r);
  s.quadraticCurveTo(x1, z1, x1 - r, z1);
  s.lineTo(x0 + r, z1);
  s.quadraticCurveTo(x0, z1, x0, z1 - r);
  s.lineTo(x0, z0 + r);
  s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: TABLE.th - 0.4,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 2,
    curveSegments: 8,
  })
    .rotateX(Math.PI / 2)
    .translate(0, -0.2, 0);
  geo.clearGroups();
  const sand = new THREE.Color(0xc4ab84);
  const band = new THREE.Color(0x8a724f);
  const n = geo.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) (n.getY(i) > 0.9 ? sand : band).toArray(tint, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.85, metalness: 0 }));
  mesh.name = 'Table';
  mesh.receiveShadow = true;
  mesh.userData.noExport = true;
  return mesh;
}

// ── the cup ───────────────────────────────────────────────────────────────────────────────────────────────────
/** The cup's turned outline, from the middle of its underside round the foot, up the outside, over the rim, down the
 * inside and across the inner bottom to the middle. `inner` is the index where the glazed inside begins. */
function cupProfile() {
  const { ri, wall, base, top, fillet } = CUP;
  const ro = ri + wall;
  const pts = [V2(0, 0.24), V2(3.0, 0.24), V2(3.12, 0.06), V2(3.3, 0), V2(3.8, 0), V2(3.98, 0.12)];
  // the belly: from the foot up to the straight wall (a quadratic curve)
  const a = V2(3.98, 0.12);
  const c = V2(ro - 0.05, 0.25);
  const b = V2(ro, 2.3);
  for (let i = 1; i <= 9; i++) {
    const k = i / 9;
    const u = 1 - k;
    pts.push(V2(u * u * a.x + 2 * u * k * c.x + k * k * b.x, u * u * a.y + 2 * u * k * c.y + k * k * b.y));
  }
  // the straight outer wall, flaring a little, and the rounded rim
  pts.push(V2(ro + 0.06, top - 0.12), V2(ro + 0.03, top - 0.03), V2(ro - 0.06, top));
  pts.push(V2(ri + 0.08, top), V2(ri + 0.02, top - 0.03));
  const inner = pts.length;
  pts.push(V2(ri, top - 0.12));
  // the inner wall down to the round bottom corner, then across
  pts.push(V2(ri, base + fillet));
  for (let i = 1; i <= 8; i++) {
    const t = (i / 8) * (Math.PI / 2);
    pts.push(V2(ri - fillet + fillet * Math.cos(t), base + fillet - fillet * Math.sin(t)));
  }
  pts.push(V2(0, base));
  return { pts, inner };
}

/** Vertex colours for a lathe of the profile: glaze outside, cream inside. */
function tintLathe(geo, count, inner, outside, inside) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  // LatheGeometry orders vertices by segment, then by profile point
  for (let i = 0; i < pos.count; i++) {
    const j = i % count;
    (j >= inner ? inside : outside).toArray(col, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

function createCup() {
  const { pts, inner } = cupProfile();
  const outside = new THREE.Color('#a8452f'); // a terracotta-red glaze
  const inside = new THREE.Color('#f4eee2'); // cream glaze: the coin shows on it
  const glaze = new THREE.MeshPhysicalMaterial({
    name: 'CupGlaze',
    vertexColors: true,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.9,
  });
  // the back half (z ≤ 0) stays; the front half fades away for the cut-away view
  const backGeo = new THREE.LatheGeometry(pts, 40, Math.PI / 2, Math.PI);
  tintLathe(backGeo, pts.length, inner, outside, inside);
  const back = new THREE.Mesh(backGeo, glaze);
  back.name = 'CupBackHalf';
  back.castShadow = true;
  back.receiveShadow = true;
  const frontGeo = new THREE.LatheGeometry(pts, 40, -Math.PI / 2, Math.PI);
  tintLathe(frontGeo, pts.length, inner, outside, inside);
  const frontMat = glaze.clone();
  frontMat.name = 'CupFrontHalf';
  frontMat.transparent = true; // it fades out; opaque while whole (depth written)
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.name = 'CupFrontHalf';
  front.castShadow = true;
  front.receiveShadow = true;

  // the cut face through the axis: the unglazed body (one shape, both sides of the axis)
  const half = [...pts];
  const shapePts = [...half.map((p) => V2(p.x, p.y)), ...half.reverse().map((p) => V2(-p.x, p.y))];
  const cutGeo = new THREE.ShapeGeometry(new THREE.Shape(shapePts), 1);
  cutGeo.translate(0, 0, 0.002);
  const body = new THREE.MeshStandardMaterial({ name: 'CupBody', color: '#e6d8c3', roughness: 0.9, metalness: 0 });
  const cut = new THREE.Mesh(cutGeo, body);
  cut.name = 'CupCutFace';
  cut.receiveShadow = true;
  // a thin glaze line round the cut, so the section reads as a cut through a glazed cup
  const edgeMat = new THREE.LineBasicMaterial({ name: 'CupCutEdge', color: '#7a2f20' });
  const edgePts = shapePts.map((p) => new THREE.Vector3(p.x, p.y, 0.004));
  edgePts.push(edgePts[0].clone());
  const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePts), edgeMat);
  edge.name = 'CupCutEdge';

  // the handle: at the back right, a rounded loop
  const dir = new THREE.Vector3(0.62, 0, -0.78).normalize();
  const ro = CUP.ri + CUP.wall;
  const at = (out, y) =>
    dir
      .clone()
      .multiplyScalar(ro - 0.25 + out)
      .setY(y);
  const curve = new THREE.CatmullRomCurve3([at(0, 5.5), at(1.3, 5.7), at(2.5, 4.9), at(2.5, 3.3), at(1.5, 2.1), at(0, 2.0)]);
  const handleGeo = new THREE.TubeGeometry(curve, 28, 0.38, 10, false);
  const handleMat = new THREE.MeshPhysicalMaterial({
    name: 'CupHandle',
    color: outside,
    roughness: 0.32,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.9,
  });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.name = 'CupHandle';
  handle.castShadow = true;

  const root = new THREE.Group();
  root.name = 'Cup';
  root.add(back, front, cut, edge, handle);
  return { root, front, frontMat, back, cut, edge };
}

// ── the coin ──────────────────────────────────────────────────────────────────────────────────────────────────
/** The coin's face: a ring of beads near the rim and a simple eight-petalled flower, as a bump and colour map. */
function coinFaceTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const m = S / 2;
  const grad = g.createRadialGradient(m * 0.8, m * 0.7, 10, m, m, m);
  grad.addColorStop(0, '#f2f4f6');
  grad.addColorStop(1, '#b9c0c8');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#8e969f';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.beginPath();
    g.arc(m + Math.cos(a) * m * 0.86, m + Math.sin(a) * m * 0.86, 3.2, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#8e969f';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(m, m, m * 0.74, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 8; i++) {
    g.save();
    g.translate(m, m);
    g.rotate((i / 8) * Math.PI * 2);
    g.beginPath();
    g.ellipse(0, -m * 0.3, m * 0.09, m * 0.26, 0, 0, Math.PI * 2);
    g.fillStyle = '#9aa2ab';
    g.fill();
    g.restore();
  }
  g.beginPath();
  g.arc(m, m, m * 0.1, 0, Math.PI * 2);
  g.fillStyle = '#e9edf0';
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function coinGeometry() {
  const { r, h } = COIN;
  const prof = [
    V2(0, 0),
    V2(r - 0.04, 0),
    V2(r, 0.035),
    V2(r, h - 0.035),
    V2(r - 0.03, h),
    V2(r - 0.15, h),
    V2(r - 0.19, h - 0.035),
    V2(0, h - 0.035),
  ];
  return new THREE.LatheGeometry(prof, 40);
}

function createCoin(faceTex) {
  const root = new THREE.Group();
  root.name = 'Coin';
  const steel = new THREE.MeshStandardMaterial({ name: 'CoinSteel', color: '#c9ced4', metalness: 1, roughness: 0.32, envMapIntensity: 1.1 });
  const body = new THREE.Mesh(coinGeometry(), steel);
  body.castShadow = true;
  const faceMat = new THREE.MeshStandardMaterial({
    name: 'CoinFace',
    map: faceTex,
    bumpMap: faceTex,
    bumpScale: 0.6,
    metalness: 0.9,
    roughness: 0.38,
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(COIN.r - 0.19, 40).rotateX(-Math.PI / 2).translate(0, COIN.h - 0.034, 0), faceMat);
  root.add(body, face);
  root.position.set(0, CUP.base, ZP);
  return { root, materials: [steel, faceMat] };
}

/** Where the coin seems to be: the same coin as a translucent ghost (about 45 %, as the sister figures' images). */
function createGhost(faceTex) {
  const root = new THREE.Group();
  root.name = 'CoinImage';
  root.userData.noExport = true;
  const mat = new THREE.MeshStandardMaterial({
    name: 'CoinImage',
    color: '#e8eef5',
    emissive: '#5c4a12',
    metalness: 0.6,
    roughness: 0.4,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    name: 'CoinImageFace',
    map: faceTex,
    metalness: 0.5,
    roughness: 0.4,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const body = new THREE.Mesh(coinGeometry(), mat);
  const face = new THREE.Mesh(new THREE.CircleGeometry(COIN.r - 0.19, 40).rotateX(-Math.PI / 2).translate(0, COIN.h - 0.034, 0), faceMat);
  body.renderOrder = 6;
  face.renderOrder = 7;
  root.add(body, face);
  root.visible = false;
  return {
    root,
    /** k: 0 … 1 of its strength; top: the y of its face. */
    set(k, top) {
      root.visible = k > 0.01;
      mat.opacity = 0.45 * k;
      faceMat.opacity = 0.5 * k;
      root.position.set(0, top - COIN.h, ZP);
    },
  };
}

// ── the water ─────────────────────────────────────────────────────────────────────────────────────────────────
const ROWS = 14; // rows of the cut face: 12 through the round corner, the rest straight
function createWater() {
  const root = new THREE.Group();
  root.name = 'Water';
  const surfMat = new THREE.MeshPhysicalMaterial({
    name: 'WaterSurface',
    color: '#9fd3f5',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide,
    envMapIntensity: 1.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  // the back half of a disc, radius 1, scaled to the cup at the level
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 48, 0, Math.PI).rotateX(-Math.PI / 2), surfMat);
  surface.name = 'WaterSurface';
  surface.renderOrder = 5;
  const faceMat = new THREE.MeshStandardMaterial({
    name: 'WaterCutFace',
    color: '#4fa8e8',
    roughness: 0.2,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pos = new Float32Array((ROWS + 1) * 2 * 3);
  const idx = [];
  for (let j = 0; j < ROWS; j++) {
    const a = j * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const faceGeo = new THREE.BufferGeometry();
  faceGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  faceGeo.setIndex(idx);
  faceGeo.setAttribute(
    'normal',
    new THREE.BufferAttribute(
      new Float32Array((ROWS + 1) * 2 * 3).map((_, i) => (i % 3 === 2 ? 1 : 0)),
      3,
    ),
  );
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.name = 'WaterCutFace';
  face.renderOrder = 4;
  face.frustumCulled = false;
  // the surface's edge on the cut: a bright line, so the boundary reads from any side
  const lineMat = new THREE.MeshBasicMaterial({ name: 'WaterLine', color: '#e7f5ff', transparent: true, opacity: 0.9, depthWrite: false });
  const line = new THREE.Mesh(new THREE.BoxGeometry(2, 0.07, 0.07), lineMat);
  line.name = 'WaterLine';
  line.renderOrder = 8;
  line.userData.noExport = true;
  root.add(surface, face, line);

  function set(level) {
    const depth = level - CUP.base;
    root.visible = depth > 0.02;
    if (!root.visible) return;
    const r = innerRadius(level) - 0.01;
    surface.scale.set(r, 1, r);
    surface.position.y = level;
    line.scale.x = r;
    line.position.set(0, level, 0.04);
    const fill = Math.min(CUP.fillet, depth);
    for (let j = 0; j <= ROWS; j++) {
      const y = j < ROWS ? CUP.base + (fill * j) / (ROWS - 1) : level;
      const yy = Math.min(y, level);
      const w = innerRadius(yy) - 0.01;
      pos.set([-w, yy, 0.01, w, yy, 0.01], j * 6);
    }
    faceGeo.attributes.position.needsUpdate = true;
    faceGeo.computeBoundingSphere();
  }
  return { root, set, surface, face };
}

// ── the jug ───────────────────────────────────────────────────────────────────────────────────────────────────
/** A small stainless-steel jug, its lip at the origin of its group (the point it pours from): the group is turned
 * about z to pour. The stream is a separate tapered tube that falls from the lip to the water. */
export const JUG = { r: 2.6, h: 8.6, lip: new THREE.Vector3(1.3, 10.8, -2.2) };
function createJug() {
  const { r, h } = JUG;
  // outline (radius, y) with the lip at y = h, on the jug's own axis; it is then moved so the spout's tip is at 0
  const prof = [
    V2(0, 0),
    V2(r - 0.25, 0),
    V2(r, 0.25),
    V2(r + 0.1, h * 0.5),
    V2(r - 0.15, h * 0.82),
    V2(r - 0.05, h - 0.2),
    V2(r + 0.12, h),
    V2(r - 0.1, h),
    V2(r - 0.3, h * 0.82),
    V2(r - 0.1, h * 0.5),
    V2(r - 0.25, 0.3),
    V2(0, 0.3),
  ];
  const steel = new THREE.MeshStandardMaterial({
    name: 'JugSteel',
    color: '#d5dae0',
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.2,
    transparent: true,
  });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), steel);
  body.castShadow = true;
  // the handle on the side away from the spout (+x)
  const hc = new THREE.CatmullRomCurve3([V3(r, h - 1.2), V3(r + 1.9, h - 1.6), V3(r + 2.1, h * 0.45), V3(r + 0.1, h * 0.3)]);
  const handle = new THREE.Mesh(new THREE.TubeGeometry(hc, 20, 0.28, 8, false), steel);
  handle.castShadow = true;
  // the water inside, seen at the mouth: a disc
  const inner = new THREE.Group();
  inner.add(body, handle);
  // the spout's tip (−x side of the lip) at the group's origin
  inner.position.set(r + 0.12, -h, 0);
  const root = new THREE.Group();
  root.name = 'Jug';
  root.userData.noExport = true;
  root.add(inner);
  root.position.copy(JUG.lip);
  root.visible = false;

  // the stream: a tube of radius 1, length 1, from y = 0 down to y = −1, scaled to the fall
  const streamMat = new THREE.MeshStandardMaterial({
    name: 'Stream',
    color: '#bfe3ff',
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.8, 1, 16, 1, true).translate(0, -0.5, 0), streamMat);
  stream.name = 'Stream';
  stream.userData.noExport = true;
  stream.renderOrder = 6;
  stream.visible = false;

  return {
    root,
    stream,
    /** in: 0 … 1 (fades in), tilt: 0 … 1 (upright … pouring), flow: 0 … 1 (the stream), level: the water's y. */
    set({ show, tilt, flow }, level) {
      root.visible = show > 0.01;
      steel.opacity = show;
      steel.depthWrite = show > 0.99;
      root.rotation.z = tilt * 1.05;
      root.position.set(JUG.lip.x + (1 - show) * 6, JUG.lip.y + (1 - show) * 2, JUG.lip.z);
      stream.visible = flow > 0.01 && root.visible;
      if (stream.visible) {
        const len = Math.max(0.1, JUG.lip.y - level);
        const w = 0.32 * Math.min(1, flow * 1.5);
        stream.scale.set(w, len * Math.min(1, flow * 2.2), w);
        stream.position.set(JUG.lip.x - 0.15, JUG.lip.y - 0.1, JUG.lip.z);
      }
    },
  };
}
function V3(x, y) {
  return new THREE.Vector3(x, y, 0);
}

export function createScene() {
  const table = createTable();
  const cup = createCup();
  const faceTex = coinFaceTexture();
  const coin = createCoin(faceTex);
  const ghost = createGhost(faceTex);
  const water = createWater();
  const jug = createJug();
  water.set(LEVEL.empty);
  return { table, cup, coin, ghost, water, jug };
}
