// The 3D model, in millimetres: a wooden board with three thermometers side by side, one liquid at one height in all
// three, each on its own cream scale plate: Celsius, Kelvin and Fahrenheit (the book's order). 1 mm of height is
// 1° C. The two marks the book's formula uses, 0 and 100 on the Celsius plate, 273.15 and 373.15 on the Kelvin plate,
// 32 and 212 on the Fahrenheit plate, sit on the same two levels and carry a coloured number; a few other numbers
// are plain. The liquid is one cylinder per tube whose height follows the level (no new geometry per frame).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT, textMesh } from '@shared/student/materials.js';
import { K0, MAX_C, MIN_C, fromF } from './reading.js';

export const SCALE_IDS = ['C', 'K', 'F'];
export const COLORS = { C: '#1c6fd9', K: '#7048e8', F: '#d9480f', liquid: '#d3202f', ink: '#1b1f24' };

export const SCALE_Y = 0.6; // mm of height for 1° C: the whole range fits a wide frame
export const H = (MAX_C - MIN_C) * SCALE_Y; // height of a scale: 216 mm
export const yOf = (c) => (c - MIN_C) * SCALE_Y;
export const cOfY = (y) => y / SCALE_Y + MIN_C;
export const PLATE_W = 132;
export const PITCH = 148; // between the plates' centres
export const PLATE_Y = [-52, H + 42]; // bottom and top of a plate
export const BOARD = { x: 2 * PITCH + PLATE_W + 40, y0: -62, y1: H + 90 }; // width, bottom, top
export const X = { C: -PITCH, K: 0, F: PITCH };
const TUBE_DX = -50; // the tube's place on its plate (from the plate's centre)
const BULB_Y = -24;
const TUBE_TOP = H + 6;
const FRONT = 3; // the plates' front face

/**
 * What each scale shows. Ticks fall at anchor + k × step in the scale's own unit (a long tick every `big`), the plain
 * numbers sit on ticks, and the two marks the formula uses (`fixed`) carry a coloured chip. Kelvin's ticks start at
 * 273.15 so that they line up with the Celsius ticks (every 10° C).
 */
const TO_C = { C: (v) => v, K: (v) => v - K0, F: fromF };
export const SCALES = {
  C: { anchor: 0, step: 10, big: 100, labels: [-40, 0, 100, 200, 300], fixed: [0, 100] },
  K: { anchor: K0, step: 10, big: 100, labels: [273.15, 373.15, 473.15, 573.15], fixed: [273.15, 373.15] },
  F: { anchor: 0, step: 20, big: 100, labels: [-40, 32, 212, 400, 500], fixed: [32, 212] },
};

const textureCache = new Map();
/** A rounded chip with a number in it (white on the scale's colour), as a flat mesh; `h` is the text height in mm. */
function chipMesh(text, h, bg) {
  const key = `${text}|${bg}`;
  let e = textureCache.get(key);
  if (!e) {
    const px = 120;
    const m = document.createElement('canvas').getContext('2d');
    m.font = `700 ${px}px ${FONT}`;
    const w = Math.ceil(m.measureText(text).width + px * 0.5);
    const hh = Math.ceil(px * 1.3);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = hh;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, hh, px * 0.28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${px}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, hh / 2 + px * 0.04);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    e = { tex, aspect: w / hh };
    textureCache.set(key, e);
  }
  const ph = h * 1.3;
  const geo = new THREE.PlaneGeometry(ph * e.aspect, ph);
  geo.translate((ph * e.aspect) / 2, 0, 0); // left edge at the origin
  const mat = new THREE.MeshBasicMaterial({ map: e.tex, transparent: true, toneMapped: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  return mesh;
}

/** A plate with rounded corners, `d` deep, front face at z = d (centred on x and y). */
function roundedPlate(w, h, d, r) {
  const sh = new THREE.Shape();
  const [x0, y0, x1, y1] = [-w / 2, -h / 2, w / 2, h / 2];
  sh.moveTo(x0 + r, y0);
  sh.lineTo(x1 - r, y0);
  sh.quadraticCurveTo(x1, y0, x1, y0 + r);
  sh.lineTo(x1, y1 - r);
  sh.quadraticCurveTo(x1, y1, x1 - r, y1);
  sh.lineTo(x0 + r, y1);
  sh.quadraticCurveTo(x0, y1, x0, y1 - r);
  sh.lineTo(x0, y0 + r);
  sh.quadraticCurveTo(x0, y0, x0 + r, y0);
  return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 });
}

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/**
 * @param {{ materials: any, digits: (x: string) => string, names: Record<string, string>, num: (v: number) => string }} o
 */
export function createThermometers({ materials: M, digits, names }) {
  const root = new THREE.Group();
  root.name = 'Thermometers';

  // ── the setting: a plaster wall and the wooden board the thermometers hang on ──
  const wallTex = (() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#4f7f8d');
    g.addColorStop(0.7, '#5f909c');
    g.addColorStop(1, '#3f6672');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(2600, 1700), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
  wall.name = 'Wall';
  wall.position.set(0, 200, -40);
  wall.receiveShadow = true;
  const setting = new THREE.Group(); // the wall: in the scene, not in the exported model
  setting.name = 'Setting';
  setting.add(wall);

  const boardW = BOARD.x;
  const boardH = BOARD.y1 - BOARD.y0;
  const board = new THREE.Mesh(new THREE.BoxGeometry(boardW, boardH, 16), M.wood);
  board.name = 'Board';
  board.position.set(0, (BOARD.y0 + BOARD.y1) / 2, -8);
  board.castShadow = true;
  board.receiveShadow = true;
  root.add(board);
  // a dark rim round the board, so its edge reads against the wall
  const rimMat = new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: 0.7 });
  const rim = mergeGeometries([
    box(boardW + 8, 8, 20, 0, BOARD.y0 - 2, -8),
    box(boardW + 8, 8, 20, 0, BOARD.y1 + 2, -8),
    box(8, boardH + 8, 20, -boardW / 2 - 2, (BOARD.y0 + BOARD.y1) / 2, -8),
    box(8, boardH + 8, 20, boardW / 2 + 2, (BOARD.y0 + BOARD.y1) / 2, -8),
  ]);
  const rimMesh = new THREE.Mesh(rim, rimMat);
  rimMesh.name = 'Rim';
  root.add(rimMesh);

  // ── shared materials ──
  const plateMat = new THREE.MeshStandardMaterial({ name: 'Plate', color: '#efe2bd', roughness: 0.55 });
  const inkMat = new THREE.MeshBasicMaterial({ name: 'Ticks', color: COLORS.ink, toneMapped: false });
  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'Glass',
    color: '#d6ecf7',
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    clearcoat: 1,
  });
  const liquidMat = new THREE.MeshPhysicalMaterial({
    name: 'Liquid',
    color: COLORS.liquid,
    roughness: 0.25,
    clearcoat: 0.8,
    emissive: '#5a0710',
    emissiveIntensity: 0.6,
  });
  const lineMat = new THREE.MeshBasicMaterial({
    name: 'Level',
    color: COLORS.liquid,
    transparent: true,
    opacity: 0.85,
    toneMapped: false,
    depthWrite: false,
  });
  const fixedMat = new THREE.MeshBasicMaterial({ name: 'Fixed', color: '#5b4a2c', transparent: true, opacity: 0.5, toneMapped: false });

  const screwMat = new THREE.MeshStandardMaterial({ name: 'Screws', color: '#b08d3c', roughness: 0.35, metalness: 0.8 });
  const shineMat = new THREE.MeshBasicMaterial({
    name: 'Glint',
    color: '#ffffff',
    transparent: true,
    opacity: 0.45,
    toneMapped: false,
    depthWrite: false,
  });
  const barMat = {};
  const liquids = {};
  const domes = {};
  const bars = {}; // from the lower fixed mark up to the liquid: T − (the lower fixed mark), in the scale's colour
  const plates = {};
  const tops = {}; // world points above each plate, where the number chips are pinned
  for (const id of SCALE_IDS) {
    const g = new THREE.Group();
    g.name = `Thermometer ${id}`;
    g.position.x = X[id];
    root.add(g);
    plates[id] = g;

    const plate = new THREE.Mesh(roundedPlate(PLATE_W, PLATE_Y[1] - PLATE_Y[0], FRONT, 7), plateMat);
    plate.name = 'Plate';
    plate.position.set(0, (PLATE_Y[0] + PLATE_Y[1]) / 2, 0);
    // two brass screws that hold the plate to the board
    const screwGeo = mergeGeometries(
      [-1, 1].map((sx) => {
        const sg = new THREE.CylinderGeometry(2.6, 2.6, 1.6, 16);
        sg.rotateX(Math.PI / 2);
        sg.translate(sx * (PLATE_W / 2 - 9), PLATE_Y[1] - 3.6, FRONT + 0.6);
        return sg;
      }),
    );
    const screws = new THREE.Mesh(screwGeo, screwMat);
    screws.name = 'Screws';
    g.add(screws);
    plate.castShadow = true;
    plate.receiveShadow = true;
    g.add(plate);

    // the coloured band and the scale's name on it
    const band = new THREE.Mesh(new THREE.PlaneGeometry(PLATE_W - 12, 27), new THREE.MeshBasicMaterial({ color: COLORS[id], toneMapped: false }));
    band.position.set(0, PLATE_Y[1] - 20, FRONT + 0.05);
    g.add(band);
    const title = textMesh(names[id], 15, { color: '#ffffff', weight: 700 });
    title.position.set(0, PLATE_Y[1] - 20, FRONT + 0.1);
    g.add(title);

    // ticks, one merged mesh: long at the numbers and every `big`, middle at the half, short between
    const sc = SCALES[id];
    const geos = [];
    const toC = TO_C[id];
    const x0 = TUBE_DX + 13; // where the ticks start
    const k0 = Math.ceil((MIN_C - 0.01 - toC(sc.anchor)) / (toC(sc.anchor + sc.step) - toC(sc.anchor)));
    const per = sc.big / sc.step;
    for (let k = k0; ; k++) {
      const v = sc.anchor + k * sc.step;
      const y = yOf(toC(v));
      if (y > H + 0.01) break;
      const labelled = sc.labels.some((l) => Math.abs(l - v) < 1e-6);
      const len = labelled || k % per === 0 ? 17 : per % 2 === 0 && k % (per / 2) === 0 ? 12 : 7.5;
      geos.push(box(len, 1.1, 0.5, x0 + len / 2, y, FRONT + 0.25));
    }
    // the fixed marks the formula uses: a longer tick, and a dashed line across the plate (and on across the gap)
    for (const v of sc.fixed) geos.push(box(24, 1.8, 0.5, x0 + 12, yOf(toC(v)), FRONT + 0.3));
    const ticks = new THREE.Mesh(mergeGeometries(geos), inkMat);
    ticks.name = 'Ticks';
    g.add(ticks);

    // numbers: plain ones in ink, the two fixed marks on a chip in the scale's colour
    for (const v of sc.labels) {
      const y = yOf(toC(v));
      const isFixed = sc.fixed.includes(v);
      const text = digits(String(v).replace('-', '\u2212'));
      const m = isFixed ? chipMesh(text, 17, COLORS[id]) : textMesh(text, 18.5, { color: COLORS.ink, weight: 700, align: 'left' });
      m.position.set(x0 + 22, y, FRONT + 0.4);
      if (!isFixed) m.position.x += 2;
      g.add(m);
    }

    // the tube: glass, the bulb, the liquid
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, TUBE_TOP - BULB_Y, 20, 1, true), glassMat);
    tube.name = 'Tube';
    tube.position.set(TUBE_DX, (BULB_Y + TUBE_TOP) / 2 + 0, FRONT + 7);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    cap.position.set(TUBE_DX, TUBE_TOP, FRONT + 7);
    const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(13, 28, 16), glassMat);
    bulbGlass.position.set(TUBE_DX, BULB_Y, FRONT + 7);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(10.5, 24, 14), liquidMat);
    bulb.position.copy(bulbGlass.position);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1, 14), liquidMat);
    col.name = 'Liquid';
    col.position.set(TUBE_DX, BULB_Y, FRONT + 7);
    tube.castShadow = bulbGlass.castShadow = true;
    // a dark slot behind the tube so the thin red column reads on the cream plate
    const slot = new THREE.Mesh(
      new THREE.PlaneGeometry(11, TUBE_TOP - BULB_Y + 4),
      new THREE.MeshBasicMaterial({ color: '#c9b98f', toneMapped: false }),
    );
    slot.position.set(TUBE_DX, (BULB_Y + TUBE_TOP) / 2, FRONT + 0.05);
    // the meniscus on top of the column, a glint along the glass and on the bulb
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 8), liquidMat);
    dome.scale.y = 0.55;
    dome.position.set(TUBE_DX, BULB_Y, FRONT + 7);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(1.5, TUBE_TOP - BULB_Y - 10), shineMat);
    glint.position.set(TUBE_DX - 2.4, (BULB_Y + TUBE_TOP) / 2, FRONT + 12.7);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(3, 14), shineMat);
    spot.position.set(TUBE_DX - 5, BULB_Y + 5, FRONT + 19.8);
    barMat[id] = new THREE.MeshBasicMaterial({ name: `Distance ${id}`, color: COLORS[id], toneMapped: false });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1, 1), barMat[id]);
    bar.position.set(TUBE_DX + 8.8, 0, FRONT + 0.6);
    bar.renderOrder = 2;
    g.add(slot, bar, bulb, col, dome, tube, cap, bulbGlass, glint, spot);
    liquids[id] = col;
    domes[id] = dome;
    bars[id] = bar;
    tops[id] = new THREE.Vector3(X[id], PLATE_Y[1] + 2, FRONT);
  }

  // the two fixed levels run on across the board: a dashed line under the numbers
  const dash = [];
  for (const c of [0, 100]) {
    for (let x = -BOARD.x / 2 + 12; x < BOARD.x / 2 - 20; x += 12) dash.push(box(7, 1.4, 0.3, x + 3.5, yOf(c), FRONT + 0.2));
  }
  const dashed = new THREE.Mesh(mergeGeometries(dash), fixedMat);
  dashed.name = 'Fixed levels';
  root.add(dashed);

  // the level line: one thin red bar across the whole board at the liquid's height
  const levelLine = new THREE.Mesh(new THREE.BoxGeometry(BOARD.x - 30, 1.6, 0.4), lineMat);
  levelLine.name = 'Level';
  levelLine.position.set(0, 0, FRONT + 0.6);
  levelLine.renderOrder = 1;
  root.add(levelLine);

  // a wider invisible strip round each tube, to take the drag (a finger is wider than a tube); not in the model
  const hit = new THREE.Group();
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const pickable = [];
  for (const id of SCALE_IDS) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(44, H + 64, 20), hitMat);
    m.position.set(X[id] + TUBE_DX, (BULB_Y + TUBE_TOP) / 2 - 8, FRONT + 8);
    m.userData.scale = id;
    hit.add(m);
    pickable.push(m);
  }

  const y0 = BULB_Y;
  /** Move the liquid (and the level line) to T_C = c, in °C. */
  function setLevel(c) {
    const y = yOf(c);
    const len = Math.max(0.01, y - y0);
    for (const id of SCALE_IDS) {
      liquids[id].scale.y = len;
      liquids[id].position.y = y0 + len / 2;
      domes[id].position.y = y;
      const y00 = yOf(0);
      const span = Math.max(0.01, Math.abs(y - y00));
      bars[id].scale.y = span;
      bars[id].position.y = (y + y00) / 2;
    }
    levelLine.position.y = y;
  }

  /** In the test, the liquid of a scale the question asks about waits (and the level line with it) until the answer. */
  function hideLiquid(ids) {
    for (const id of SCALE_IDS) liquids[id].visible = domes[id].visible = bars[id].visible = !ids.includes(id);
    levelLine.visible = ids.length === 0;
  }

  return {
    root,
    setting,
    hideLiquid,
    hit,
    pickable,
    setLevel,
    /** The world point above a plate, for the number chip. */
    top: (id) => tops[id],
    /** The liquid's top in the Celsius tube, in world space (the ring and the badge go here). */
    grip: (c, out = new THREE.Vector3()) => out.set(X.C + TUBE_DX, yOf(c), FRONT + 7),
    /** The Kelvin thermometer's bulb in world space (the ring and the badge of the action go here). */
    bulbPoint: new THREE.Vector3(X.K + TUBE_DX, BULB_Y, FRONT + 7),
    /** The scene's frame: the three plates and the chips above them; the board runs off the edges on a wide frame. */
    frame: () =>
      new THREE.Box3(
        new THREE.Vector3(-PITCH - PLATE_W / 2 - 12, PLATE_Y[0] - 8, -16),
        new THREE.Vector3(PITCH + PLATE_W / 2 + 12, PLATE_Y[1] + 38, 22),
      ),
    plateSize: { w: PLATE_W, x: X },
  };
}
