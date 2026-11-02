// The 3D of চিত্র ৬.০২: three glass thermometers side by side on a pale painted board, standing on a bench in front of a
// wall: the Celsius, the Kelvin and the Fahrenheit one. One temperature, three scales: the dark column rises to the same
// height in all three. Horizontal lines run across at the fixed points (as in the book), a crimson line at the
// temperature now. Millimetres: a tube is 230 mm tall. The vertical scale (which temperatures the tubes show) can
// change, to show the whole way down to absolute zero.
import * as THREE from 'three';
import { boxProjectUV } from '@shared/student/materials.js';
import { ABS_ZERO, BOIL_C, HI, ICE_C, LO_NORMAL, SCALE_IDS, ticksFor } from './reading.js';

export const SPACING = 96; // between the tubes
export const H = 230; // the graduated length of a tube
export const PLATE_W = 26; // the ivory scale plate behind each tube
export const TUBE_DX = 5.5; // the tube sits right of the plate's middle, the graduations on its left
export const TUBE_Z = -1.5;
export const BULB_Y = -10;
export const PLATE_Z = -6;
export const FRONT_Z = -4.6; // the lines and graduations on the plates
export const BOARD = { x0: -50, y0: -50, y1: H + 70 };
export const board_x1 = (spacing) => spacing * 2 + 98; // the board's right edge: room for the labels
export const COLORS = { ink: '#1f3347', level: '#d6336c', mercury: '#3b4552' };

const MAX_TICKS = 64;
/** The colours of the three scales (labels, panel). */
export const SCALE_COLORS = { C: '#1c6fd9', K: '#237a35', F: '#862e9c' };

function gradientTexture(stops) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {{ materials: any, shadows?: boolean }} options
 */
export function createBoard({ materials: M, shadows = false }) {
  const root = new THREE.Group();
  root.name = 'Thermometers';
  const tubeX = SCALE_IDS.map((_, i) => i * SPACING); // the tubes' x (mm); setSpacing moves them
  let spacing = SPACING;
  let lo = LO_NORMAL;
  const hi = HI;
  const y = (c) => ((c - lo) / (hi - lo)) * H;
  const cOf = (yy) => lo + (yy / H) * (hi - lo);

  // ── the setting: a wall, a bench and the board ──
  const wallTex = gradientTexture([
    [0, '#7fa3b0'],
    [1, '#3f6573'],
  ]);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1800, 900), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
  wall.position.set(SPACING, 160, -150);
  wall.receiveShadow = true;
  wall.name = 'Wall';
  const benchGeo = boxProjectUV(new THREE.BoxGeometry(1100, 24, 460));
  const bench = new THREE.Mesh(benchGeo, M.wood);
  bench.position.set(SPACING, BOARD.y0 - 12, 20);
  bench.receiveShadow = true;
  bench.name = 'Bench';
  const paint = new THREE.MeshStandardMaterial({ color: '#b7cbd4', roughness: 0.7, metalness: 0 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1, BOARD.y1 - BOARD.y0, 10), paint);
  board.position.set(0, (BOARD.y0 + BOARD.y1) / 2, PLATE_Z - 6.5);
  board.castShadow = true;
  board.receiveShadow = true;
  board.name = 'Board';
  root.add(wall, bench, board);

  // ── the ivory plates, the graduations, the tubes and the columns ──
  const plateMat = new THREE.MeshStandardMaterial({ color: '#f4ecd8', roughness: 0.6 });
  const inkMat = new THREE.MeshBasicMaterial({ color: COLORS.ink });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#d6edf7',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const merc = new THREE.MeshStandardMaterial({ color: COLORS.mercury, metalness: 0.9, roughness: 0.22 });
  const plateGeo = new THREE.BoxGeometry(PLATE_W, H + 50, 2);
  const tickGeo = new THREE.BoxGeometry(1, 1, 0.4);
  const tubeLen = H + 14;
  const tubeGeo = new THREE.CylinderGeometry(4.4, 4.4, tubeLen, 20, 1, true);
  const capGeo = new THREE.SphereGeometry(4.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const bulbGlassGeo = new THREE.SphereGeometry(8.6, 24, 16);
  const bulbGeo = new THREE.SphereGeometry(6.4, 20, 14);
  const colGeo = new THREE.CylinderGeometry(1.8, 1.8, 1, 12);
  colGeo.translate(0, 0.5, 0);
  const pickables = [];
  const groups = [];
  const columns = [];
  const tickMeshes = [];
  const m4 = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const s3 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  SCALE_IDS.forEach((id, i) => {
    const g = new THREE.Group();
    g.name = `Thermometer ${id}`;
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, H / 2, PLATE_Z);
    plate.castShadow = true;
    plate.receiveShadow = true;
    const ticks = new THREE.InstancedMesh(tickGeo, inkMat, MAX_TICKS);
    ticks.count = 0;
    ticks.frustumCulled = false;
    ticks.name = `Graduations ${id}`;
    const tube = new THREE.Mesh(tubeGeo, glass);
    tube.position.set(TUBE_DX, BULB_Y + tubeLen / 2, TUBE_Z);
    tube.renderOrder = 3;
    const cap = new THREE.Mesh(capGeo, glass);
    cap.position.set(TUBE_DX, BULB_Y + tubeLen, TUBE_Z);
    cap.renderOrder = 3;
    const bulbGlass = new THREE.Mesh(bulbGlassGeo, glass);
    bulbGlass.position.set(TUBE_DX, BULB_Y, TUBE_Z);
    bulbGlass.renderOrder = 3;
    const bulb = new THREE.Mesh(bulbGeo, merc);
    bulb.position.set(TUBE_DX, BULB_Y, TUBE_Z);
    const col = new THREE.Mesh(colGeo, merc);
    col.position.set(TUBE_DX, BULB_Y, TUBE_Z);
    tube.castShadow = true;
    bulb.castShadow = false;
    g.add(plate, ticks, bulb, col, bulbGlass, tube, cap);
    g.position.x = tubeX[i];
    groups.push(g);
    root.add(g);
    pickables.push(plate, tube, bulbGlass);
    columns.push(col);
    tickMeshes.push(ticks);
  });

  // ── the lines across: the fixed points (ice, boiling, absolute zero) and the temperature now ──
  const lineGeo = new THREE.BoxGeometry(1, 1, 0.4);
  const guideMat = new THREE.MeshBasicMaterial({ color: COLORS.ink });
  const guides = [ICE_C, BOIL_C, ABS_ZERO].map((c) => {
    const m = new THREE.Mesh(lineGeo, guideMat);
    m.position.set(0, 0, FRONT_Z + 0.1);
    m.name = `Fixed point ${c}`;
    root.add(m);
    return { c, mesh: m };
  });
  const levelMat = new THREE.MeshBasicMaterial({ color: COLORS.level });
  const levelLine = new THREE.Mesh(lineGeo, levelMat);
  levelLine.scale.set(1, 1.5, 1);
  levelLine.position.set(0, 0, FRONT_Z + 0.2);
  levelLine.name = 'Temperature now';
  root.add(levelLine);

  // ── light ──
  const sun = new THREE.DirectionalLight('#fff4e2', 1.5);
  sun.position.set(-90, 330, 260);
  sun.target.position.set(SPACING, 110, 0);
  const hemi = new THREE.HemisphereLight('#f2f6ff', '#5b4a3a', 0.8);
  const fill = new THREE.DirectionalLight('#dbe9ff', 0.45);
  fill.position.set(220, 120, 280);
  root.add(sun, sun.target, hemi, fill);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.3;
    Object.assign(sun.shadow.camera, { left: -140, right: 330, top: 330, bottom: -80, near: 100, far: 700 });
  }

  // ── state: the temperature and the scale it is read against ──
  let level = 30;
  let guidesOn = true;
  let ticksLo = Number.NaN;

  function updateTicks() {
    if (ticksLo === lo) return;
    ticksLo = lo;
    SCALE_IDS.forEach((id, i) => {
      const list = ticksFor(id, lo, hi, MAX_TICKS);
      const mesh = tickMeshes[i];
      mesh.count = list.length;
      list.forEach((tk, n) => {
        const len = tk.major ? 9 : 6;
        const th = tk.major ? 1.3 : 0.95;
        p3.set(-11 + len / 2, y(tk.c), FRONT_Z);
        s3.set(len, th, 1);
        m4.compose(p3, q0, s3);
        mesh.setMatrixAt(n, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }
  function layout() {
    const x0 = BOARD.x0;
    const x1 = board_x1(spacing);
    board.scale.x = x1 - x0;
    board.position.x = (x0 + x1) / 2;
    const w = x1 - x0 - 20;
    const cx = (x0 + x1) / 2;
    for (const gd of guides) {
      gd.mesh.scale.x = w;
      gd.mesh.position.x = cx;
    }
    levelLine.scale.x = w;
    levelLine.position.x = cx;
    wall.position.x = bench.position.x = spacing;
    sun.target.position.x = spacing;
    sun.shadow.camera.right = spacing * 2 + 130;
    groups.forEach((g, i) => {
      tubeX[i] = i * spacing;
      g.position.x = tubeX[i];
    });
  }
  function place() {
    updateTicks();
    for (const gd of guides) {
      const yy = y(gd.c);
      gd.mesh.visible = guidesOn && yy >= -0.5 && yy <= H + 0.5;
      gd.mesh.position.y = yy;
      gd.mesh.scale.y = 1.1;
    }
    const yl = Math.min(H, Math.max(0, y(level)));
    levelLine.position.y = yl;
    for (const col of columns) col.scale.y = Math.max(0.01, yl - BULB_Y);
  }
  layout();
  place();

  return {
    root,
    tubeX,
    /** The distance between the tubes (mm): wider where the frame is wide and short, so the labels have room. */
    setSpacing(sp) {
      if (sp === spacing) return;
      spacing = sp;
      layout();
      place();
    },
    get spacing() {
      return spacing;
    },
    pickables,
    /** Height (mm, above the tubes' zero) of a temperature °C under the present scale. */
    y,
    /** The temperature (°C) at a height. */
    cOf,
    get lo() {
      return lo;
    },
    /** Which temperatures the tubes show: from `newLo` up to the fixed top. */
    setLo(newLo) {
      lo = newLo;
      place();
    },
    /** The temperature the columns and the crimson line stand at. */
    setLevel(c) {
      level = c;
      place();
    },
    /** The lines across at the fixed points (hidden in the test until the answer shows). */
    setGuides(on) {
      guidesOn = on;
      place();
    },
    /** World point of the top of the Celsius column (the ring's target) into `out`. */
    columnTop(out, i = 0) {
      return out.set(tubeX[i] + TUBE_DX, Math.min(H, Math.max(0, y(level))), TUBE_Z);
    },
    sun,
    dispose() {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) o.geometry.dispose();
      });
      wallTex.dispose();
    },
  };
}
