// The water tank, in metres (the ground the jets land on is y = 0): a clear glass cylinder on a brick stand, water
// H = 1 m deep in a rich blue that darkens with depth, three brass spouts on its right side (depths 0.2, 0.4 and
// 0.6 m) each stopped with a cork, the jets (a tube along each one's parabola, built once and shown a part at a time
// as the water comes out), the imagined column of water above a surface A (the book's figure 5.02: a dashed cylinder
// and the teal surface at its bottom) and a depth gauge beside the glass, 0 at the water's surface. Cheap geometry
// throughout: software WebGL in CI must draw it quickly.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AREA_CM2, H, HOLES, HOLE_IDS, STAND, holeHeight, jetDrop, jetReach, toM2 } from './reading.js';

export const R = 0.24; // the glass's inner radius
export const GLASS_TOP = STAND + 1.1;
export const SURFACE = STAND + H; // the water's surface
export const NOZZLE = 0.05; // how far a spout sticks out of the glass
export const COLUMN_R = Math.sqrt(toM2(AREA_CM2) / Math.PI); // 100 cm² → 5.64 cm
export const GAUGE_X = -R - 0.032; // the depth gauge's middle line
export const holeY = (id) => SURFACE - HOLES[id];
/** Where the water leaves a spout. */
export const jetStart = (id, out = new THREE.Vector3()) => out.set(R + NOZZLE, holeY(id), 0);
const JET_SEGMENTS = 64;
const JET_RADIAL = 10;

export function createTank() {
  const root = new THREE.Group();
  root.name = 'WaterTank';

  // ── glass, base, water ──────────────────────────────────────────────────────
  const glassMat = (side) =>
    new THREE.MeshStandardMaterial({
      name: 'Glass',
      color: '#eaf6ff',
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: side === THREE.BackSide ? 0.06 : 0.09,
      depthWrite: false,
      side,
    });
  const glassGeo = new THREE.CylinderGeometry(R + 0.006, R + 0.006, GLASS_TOP - STAND + 0.03, 72, 1, true);
  const glassBack = new THREE.Mesh(glassGeo, glassMat(THREE.BackSide));
  const glassFront = new THREE.Mesh(glassGeo, glassMat(THREE.FrontSide));
  for (const g of [glassBack, glassFront]) g.position.y = (GLASS_TOP + STAND - 0.03) / 2;
  glassBack.name = 'GlassBack';
  glassFront.name = 'GlassFront';
  glassBack.renderOrder = 1;
  glassFront.renderOrder = 6;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(R + 0.006, 0.007, 10, 72),
    new THREE.MeshStandardMaterial({ name: 'GlassRim', color: '#f4fbff', roughness: 0.1, transparent: true, opacity: 0.75 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = GLASS_TOP;
  rim.name = 'Rim';
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.03, R + 0.034, 0.04, 72),
    new THREE.MeshStandardMaterial({ name: 'Base', color: '#2d3a4f', roughness: 0.45, metalness: 0.3 }),
  );
  base.position.y = STAND - 0.02;
  base.name = 'Base';
  base.castShadow = true;
  base.receiveShadow = true;

  // the water: a rich clear blue, deeper at the bottom (vertex colours), and its surface a lighter, shiny blue
  const waterGeo = new THREE.CylinderGeometry(R - 0.001, R - 0.001, H, 72, 12, true);
  const top = new THREE.Color('#1f8ef5');
  const bottom = new THREE.Color('#0638a8');
  const pos = waterGeo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.lerpColors(bottom, top, pos.getY(i) / H + 0.5);
    c.toArray(colors, i * 3);
  }
  waterGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const waterMat = new THREE.MeshStandardMaterial({
    name: 'Water',
    vertexColors: true,
    emissive: '#0a47c2',
    emissiveIntensity: 0.28,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = STAND + H / 2;
  water.name = 'Water';
  water.renderOrder = 2;
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(R - 0.001, 72),
    new THREE.MeshStandardMaterial({
      name: 'WaterSurface',
      color: '#6cc0fa',
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = SURFACE;
  surface.name = 'WaterSurface';
  surface.renderOrder = 3;
  const floorOfWater = new THREE.Mesh(
    new THREE.CircleGeometry(R - 0.001, 72),
    new THREE.MeshStandardMaterial({ name: 'TankFloor', color: '#0b3a86', roughness: 0.6 }),
  );
  floorOfWater.rotation.x = -Math.PI / 2;
  floorOfWater.position.y = STAND + 0.001;
  floorOfWater.name = 'TankFloor';
  root.add(base, floorOfWater, glassBack, water, surface, glassFront, rim);

  // ── the spouts, their corks and their jets ─────────────────────────────────
  const brass = new THREE.MeshStandardMaterial({ name: 'Brass', color: '#d9a43a', roughness: 0.28, metalness: 0.85 });
  const dark = new THREE.MeshBasicMaterial({ name: 'SpoutInside', color: '#0d2348' });
  const cork = new THREE.MeshStandardMaterial({ name: 'Cork', color: '#b9824a', roughness: 0.85 });
  // streaks along the jet (the tube's u runs along it), so it reads as running water, not a wire
  const streaks = document.createElement('canvas');
  streaks.width = 128;
  streaks.height = 32;
  const sx = /** @type {CanvasRenderingContext2D} */ (streaks.getContext('2d'));
  sx.fillStyle = '#5fb6ff';
  sx.fillRect(0, 0, 128, 32);
  for (const [y, w, a] of [
    [4, 3, 0.75],
    [11, 2, 0.5],
    [16, 4, 0.95],
    [23, 2, 0.55],
    [28, 3, 0.7],
  ]) {
    const g = sx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, `rgba(255,255,255,${a * 0.3})`);
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, `rgba(255,255,255,${a * 0.3})`);
    sx.fillStyle = g;
    sx.fillRect(0, y, 128, w);
  }
  const streakTex = new THREE.CanvasTexture(streaks);
  streakTex.colorSpace = THREE.SRGBColorSpace;
  streakTex.wrapS = THREE.RepeatWrapping;
  streakTex.wrapT = THREE.RepeatWrapping;
  streakTex.repeat.set(10, 1);
  const jetMat = new THREE.MeshStandardMaterial({
    name: 'Jet',
    map: streakTex,
    color: '#ffffff',
    emissive: '#2a7fe6',
    emissiveIntensity: 0.4,
    roughness: 0.06,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  const dropMat = new THREE.MeshStandardMaterial({
    name: 'Drops',
    color: '#a8dcff',
    emissive: '#1b6fd6',
    emissiveIntensity: 0.25,
    roughness: 0.05,
    transparent: true,
    opacity: 0.9,
  });
  const dropGeo = new THREE.SphereGeometry(0.0085, 10, 8);
  const ringGeo = new THREE.RingGeometry(0.025, 0.05, 28);
  const splashMat = new THREE.MeshBasicMaterial({ name: 'Splash', color: '#e3f4ff', transparent: true, opacity: 0.85, depthWrite: false });
  brass.side = THREE.DoubleSide; // the open tube is seen from inside too
  const holes = {};
  const pickable = [];
  const P = new THREE.Vector3();
  // the three spouts never move: their brass (tube, flange, lip) is one mesh and their dark mouths another
  const brassParts = [];
  const mouthParts = [];
  const M = new THREE.Matrix4();
  const E = new THREE.Euler();
  const placed = (geo, x, y, rx, ry, rz) => geo.applyMatrix4(M.makeRotationFromEuler(E.set(rx, ry, rz)).setPosition(x, y, 0));
  const plugGeo = new THREE.CylinderGeometry(0.016, 0.0205, 0.036, 20);
  const hitGeo = new THREE.SphereGeometry(0.06, 12, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  for (const id of HOLE_IDS) {
    const y = holeY(id);
    const g = new THREE.Group();
    g.name = `Spout_${id}`;
    brassParts.push(
      placed(new THREE.CylinderGeometry(0.021, 0.021, NOZZLE + 0.012, 24, 1, true), R + (NOZZLE - 0.012) / 2, y, 0, 0, -Math.PI / 2),
      placed(new THREE.TorusGeometry(0.025, 0.006, 10, 28), R + 0.006, y, 0, Math.PI / 2, 0),
      placed(new THREE.TorusGeometry(0.0212, 0.0038, 8, 24), R + NOZZLE, y, 0, Math.PI / 2, 0),
    );
    mouthParts.push(placed(new THREE.CircleGeometry(0.0182, 20), R + NOZZLE - 0.004, y, 0, Math.PI / 2, 0));
    const plug = new THREE.Mesh(plugGeo, cork);
    plug.rotation.z = Math.PI / 2;
    plug.name = `Cork_${id}`;
    plug.castShadow = true;
    g.add(plug);

    // the jet: x from the spout, y = y0 − x²/4h (Torricelli), down to the ground; a little thinner as it falls
    const h = HOLES[id];
    const reach = jetReach(h);
    const x0 = R + NOZZLE;
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = (reach * i) / 80;
      pts.push(new THREE.Vector3(x0 + x, y - jetDrop(h, x), 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const jetGeo = new THREE.TubeGeometry(curve, JET_SEGMENTS, 0.0165, JET_RADIAL, false);
    const jp = jetGeo.getAttribute('position');
    for (let i = 0; i <= JET_SEGMENTS; i++) {
      const u = i / JET_SEGMENTS;
      curve.getPointAt(u, P);
      const k = 1 - 0.38 * u;
      for (let j = 0; j <= JET_RADIAL; j++) {
        const at = i * (JET_RADIAL + 1) + j;
        jp.setXYZ(at, P.x + (jp.getX(at) - P.x) * k, P.y + (jp.getY(at) - P.y) * k, P.z + (jp.getZ(at) - P.z) * k);
      }
    }
    jetGeo.computeVertexNormals();
    const jet = new THREE.Mesh(jetGeo, jetMat);
    jet.name = `Jet_${id}`;
    jet.visible = false;
    jet.renderOrder = 4;
    jet.castShadow = false;
    // where it lands: a ring of splash on the ground and a few drops thrown up
    const land = new THREE.Vector3(x0 + reach, 0, 0);
    const splash = new THREE.Group();
    splash.name = `Splash_${id}`;
    const ring = new THREE.Mesh(ringGeo, splashMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(land.x, 0.012, 0);
    ring.scale.set(1.5, 1, 1);
    const drops = new THREE.InstancedMesh(dropGeo, dropMat, 9);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.4;
      const r = 0.035 + 0.025 * ((i * 7) % 3);
      const s = 0.6 + 0.25 * ((i * 5) % 3);
      m4.makeScale(s, s, s).setPosition(land.x + Math.cos(a) * r * 1.4, 0.02 + 0.03 * ((i * 4) % 3), Math.sin(a) * r);
      drops.setMatrixAt(i, m4);
    }
    splash.add(ring, drops);
    splash.visible = false;
    // a touch target round the spout's mouth (generous: fingers)
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.position.set(R + NOZZLE * 0.6, y, 0);
    hit.name = `Hit_${id}`;
    hit.userData = { hole: id, noExport: true };
    pickable.push(hit);
    g.add(hit);
    root.add(g, jet, splash);
    holes[id] = {
      group: g,
      plug,
      jet,
      splash,
      segments: JET_SEGMENTS,
      count: jetGeo.index ? jetGeo.index.count : 0,
      reach,
      mouth: new THREE.Vector3(R + NOZZLE, y, 0),
    };
  }
  const spouts = new THREE.Mesh(mergeGeometries(brassParts), brass);
  spouts.name = 'Spouts';
  spouts.castShadow = true;
  const mouths = new THREE.Mesh(mergeGeometries(mouthParts), dark);
  mouths.name = 'SpoutMouths';
  for (const geo of [...brassParts, ...mouthParts]) geo.dispose();
  root.add(spouts, mouths);
  const PLUG_X = R + NOZZLE + 0.004;

  /** A cork: k = 0 in the spout, 1 flown out and gone (it pops out and falls). */
  function setCork(id, k) {
    const { plug } = holes[id];
    const y = holeY(id);
    plug.visible = k < 0.999;
    plug.position.set(PLUG_X + 0.16 * k, y - 0.3 * k * k + 0.05 * k, 0.02 * k);
    plug.rotation.set(0, 0, Math.PI / 2 - 2.4 * k);
  }
  /** A jet: k = the part of its path the water has reached (0 … 1); the splash shows once it lands. */
  function setJet(id, k) {
    const hj = holes[id];
    hj.jet.visible = k > 0.001;
    const seg = Math.max(1, Math.ceil(hj.segments * Math.min(1, k)));
    hj.jet.geometry.setDrawRange(0, seg * JET_RADIAL * 6);
    hj.splash.visible = k >= 0.999;
  }
  for (const id of HOLE_IDS) {
    setCork(id, 0);
    setJet(id, 0);
  }

  // ── the imagined column above A (the book's figure 5.02) ───────────────────
  const column = new THREE.Group();
  column.name = 'ImaginedColumn';
  column.userData.noExport = true;
  const colBody = new THREE.Mesh(
    new THREE.CylinderGeometry(COLUMN_R, COLUMN_R, 1, 40, 1, true).translate(0, -0.5, 0),
    new THREE.MeshBasicMaterial({ color: '#e4f4ff', transparent: true, opacity: 0.36, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  colBody.renderOrder = 5;
  colBody.position.y = SURFACE;
  const dashMat = new LineMaterial({
    color: '#ffffff',
    linewidth: 0.0042,
    worldUnits: true,
    dashed: true,
    dashSize: 0.018,
    gapSize: 0.011,
    transparent: true,
    depthTest: false,
  });
  const dashes = new Line2(new LineGeometry(), dashMat);
  dashes.renderOrder = 7;
  dashes.frustumCulled = false;
  column.add(colBody, dashes);
  // the surface A: a teal disc whose top is at the depth h
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(COLUMN_R, COLUMN_R, 0.014, 40),
    // transparent (but solid) so it is drawn after the water, not tinted away behind it
    new THREE.MeshStandardMaterial({
      name: 'SurfaceA',
      color: '#12b3c9',
      emissive: '#0c8599',
      emissiveIntensity: 0.55,
      roughness: 0.4,
      transparent: true,
      opacity: 1,
    }),
  );
  plate.name = 'SurfaceA';
  plate.renderOrder = 8;
  const plateEdge = new THREE.Mesh(
    new THREE.TorusGeometry(COLUMN_R, 0.0035, 8, 40),
    new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true }),
  );
  plateEdge.rotation.x = Math.PI / 2;
  plateEdge.position.y = 0.007;
  plateEdge.renderOrder = 8;
  plate.add(plateEdge);
  const plateHit = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16), new THREE.MeshBasicMaterial({ visible: false }));
  plateHit.userData.noExport = true;
  plate.add(plateHit);
  root.add(column, plate);

  // the dashed outline: the top circle, down one side, the bottom circle, up the other side. The same 85 points at
  // every depth, so a drag rewrites the line's buffers in place instead of building a new geometry each frame.
  const RING = 40;
  const NPTS = 2 * (RING + 1) + 3;
  const pts = new Float32Array(NPTS * 3);
  const outline = (yb) => {
    let k = 0;
    const put = (x, y, z) => {
      pts[k++] = x;
      pts[k++] = y;
      pts[k++] = z;
    };
    for (let i = 0; i <= RING; i++) put(Math.cos((i / RING) * Math.PI * 2) * COLUMN_R, SURFACE, Math.sin((i / RING) * Math.PI * 2) * COLUMN_R);
    put(COLUMN_R, yb, 0);
    for (let i = 0; i <= RING; i++) put(Math.cos((i / RING) * Math.PI * 2) * COLUMN_R, yb, Math.sin((i / RING) * Math.PI * 2) * COLUMN_R);
    put(-COLUMN_R, yb, 0);
    put(-COLUMN_R, SURFACE, 0);
  };
  outline(SURFACE - HOLES.top);
  dashes.geometry.setPositions(pts);
  dashes.computeLineDistances();
  const segBuf = /** @type {any} */ (dashes.geometry.getAttribute('instanceStart')).data;
  const distBuf = /** @type {any} */ (dashes.geometry.getAttribute('instanceDistanceStart')).data;
  let lastDepth = HOLES.top;
  /** Put A at the depth h (m) and stretch the column above it up to the surface. */
  function setDepth(h) {
    plate.position.y = SURFACE - h - 0.007;
    colBody.scale.y = h;
    if (Math.abs(h - lastDepth) < 1e-6) return;
    lastDepth = h;
    outline(SURFACE - h);
    const seg = segBuf.array;
    const dist = distBuf.array;
    let d = 0;
    for (let i = 0; i < NPTS - 1; i++) {
      const a = i * 3;
      for (let j = 0; j < 6; j++) seg[i * 6 + j] = pts[a + j];
      dist[i * 2] = d;
      d += Math.hypot(pts[a + 3] - pts[a], pts[a + 4] - pts[a + 1], pts[a + 5] - pts[a + 2]);
      dist[i * 2 + 1] = d;
    }
    segBuf.needsUpdate = true;
    distBuf.needsUpdate = true;
  }
  setDepth(HOLES.top);

  // ── the depth gauge: an enamel strip beside the glass, 0 at the surface, marks every 5 cm ──────────────
  const gauge = new THREE.Group();
  gauge.name = 'DepthGauge';
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, H + 0.04, 0.008),
    new THREE.MeshStandardMaterial({ name: 'Gauge', color: '#fffaf0', roughness: 0.5 }),
  );
  strip.position.set(GAUGE_X, SURFACE - H / 2 + 0.005, 0.03);
  strip.castShadow = true;
  // the red fill: pressure grows with depth (shown once the student has compared two holes)
  const fillGeo = new THREE.PlaneGeometry(0.03, H, 1, 10);
  const fp = fillGeo.getAttribute('position');
  const fc = new Float32Array(fp.count * 3);
  const light = new THREE.Color('#ffe3e3');
  const deep = new THREE.Color('#c92a2a');
  for (let i = 0; i < fp.count; i++) {
    c.lerpColors(deep, light, fp.getY(i) / H + 0.5);
    c.toArray(fc, i * 3);
  }
  fillGeo.setAttribute('color', new THREE.BufferAttribute(fc, 3));
  const fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, opacity: 1 }));
  fill.position.set(GAUGE_X, SURFACE - H / 2, 0.0345);
  fill.name = 'GaugeFill';
  fill.visible = false;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.032, 0.06, 3).rotateZ(Math.PI),
    new THREE.MeshBasicMaterial({ color: '#c92a2a', toneMapped: false }),
  );
  head.position.set(GAUGE_X, STAND - 0.03, 0.035);
  head.name = 'GaugeHead';
  head.visible = false;
  const markMat = new THREE.MeshBasicMaterial({ color: '#1d2733' });
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.003, 0.002), markMat, 21);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i <= 20; i++) {
    const long = i % 2 === 0;
    const w = long ? 0.028 : 0.015;
    m4.makeScale(w, long ? 1.4 : 1, 1).setPosition(GAUGE_X + 0.018 - w / 2, SURFACE - i * 0.05, 0.0352);
    marks.setMatrixAt(i, m4);
  }
  marks.name = 'GaugeMarks';
  gauge.add(strip, fill, head, marks);
  root.add(gauge);
  /** The gauge's red fill: k = 0 none, 1 down to the bottom. */
  function setGaugeFill(k) {
    fill.visible = k > 0.001;
    head.visible = k >= 0.999;
    fill.scale.y = Math.max(0.001, k);
    fill.position.y = SURFACE - (H * k) / 2;
  }

  return {
    root,
    holes,
    pickable,
    plate,
    plateHit,
    column,
    gauge,
    setCork,
    setJet,
    setDepth,
    setGaugeFill,
    /** The heights of the holes above the ground, for the record. */
    heights: Object.fromEntries(HOLE_IDS.map((id) => [id, holeHeight(HOLES[id])])),
  };
}
