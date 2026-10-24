// The caliper model, built procedurally in millimetres.
//
// Axes: +X along the beam, +Y up, +Z toward the viewer. The main-scale zero is x = 0.
// The slider group sits at x = gap (true jaw opening). Its vernier zero is at local x = 0
// (shifted by the zero error), and its outside-jaw face at local x = DIM.faceX.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { textMesh, boxProjectUV, INK } from '@shared/student/materials.js';
import { divisionsFor } from './reading.js';

export const DIM = {
  beamStart: -34,
  beamEnd: 222,
  beamTop: 18,
  beamHalfT: 2,
  faceX: -4, // outside-jaw measuring faces: fixed at faceX, slider at gap + faceX
  innerX: -7, // inside-jaw measuring edges: fixed at innerX, slider at gap + innerX
  innerTip: [28.5, 35], // y range where the inside jaws are parallel
  jawTip: -44,
  scaleY: 7, // boundary between main-scale and vernier ticks
  scaleEnd: 200,
  maxGap: 150,
  sliderStart: -4,
  sliderEnd: 62,
  plateZ: 3.4,
  // The vernier ticks sit on a flat land just proud of the beam (tiny parallax, no perspective slant);
  // below it a chamfer steps out to the plate face that carries the numbers.
  bevelTop: [7, 2.25], // [y, z] top of the tick land
  bevelBottom: [3.9, 2.25], // [y, z] bottom of the tick land
  chamferBottom: 2.7, // y where the chamfer meets the plate face
  rodY: 9.25,
  rodZ: -2.45,
  rodHalfH: 1.25,
  rodHalfT: 0.35,
  rollerR: 4.2,
};

// Same colours as the reading panel, so "M", "V" and the vernier zero are easy to connect.
export const HIGHLIGHT = {
  msr: new THREE.Color('#1c6fd9'),
  zero: new THREE.Color('#12924f'),
  coincide: new THREE.Color('#e8590c'),
  scan: new THREE.Color('#9c36b5'),
};

const DEFAULT_TEXT = { digits: (x) => String(x), cm: 'cm', mm: 'mm', brand: 'PATHSHALA', range: '0–150 mm' };

const BEVEL_ANGLE = Math.atan2(DIM.bevelBottom[1] - DIM.bevelTop[1], DIM.bevelTop[0] - DIM.bevelBottom[0]); // 0 = flat land

// ── geometry helpers ───────────────────────────────────────────────────────────
function extrude(shape, z0, z1, bevel = 0.3, curveSegments = 28) {
  const depth = z1 - z0 - 2 * bevel;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
  });
  g.translate(0, 0, z0 + bevel);
  return boxProjectUV(g);
}

/** Prism along X from a (z, y) cross-section. */
function prismX(pointsZY, x0, x1, bevel = 0.1) {
  const shape = new THREE.Shape(pointsZY.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = extrude(shape, 0, x1 - x0, bevel);
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  return boxProjectUV(g);
}

function rbox(x0, x1, y0, y1, z0, z1, radius = 0.5) {
  const r = Math.min(radius, (x1 - x0) / 2.01, (y1 - y0) / 2.01, (z1 - z0) / 2.01);
  const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 3, r);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return boxProjectUV(g);
}

function knurlShape(r, teeth, depth) {
  const s = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r - depth;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  return s;
}

function mesh(geometry, material, name) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  return m;
}

// ── tick marks ─────────────────────────────────────────────────────────────────
const TICK_W = 0.12;
const unitPlane = new THREE.PlaneGeometry(1, 1);

function tickMesh(count, material, name) {
  const m = new THREE.InstancedMesh(unitPlane, material, count);
  m.name = name;
  m.renderOrder = 1;
  for (let i = 0; i < count; i++) m.setColorAt(i, INK);
  return m;
}

// ── build ──────────────────────────────────────────────────────────────────────
export function createCaliper({ materials, lc = 0.1, zeroError = 0, text: textOpts = {} }) {
  const M = materials;
  const T = { ...DEFAULT_TEXT, ...textOpts };
  const root = new THREE.Group();
  root.name = 'VernierCaliper';
  const fixed = new THREE.Group();
  fixed.name = 'FixedPart';
  const slider = new THREE.Group();
  slider.name = 'Slider';
  root.add(fixed, slider);

  // Beam, fixed head and fixed outside jaw: one machined piece.
  const beamShape = new THREE.Shape();
  beamShape.moveTo(-29, 18);
  beamShape.lineTo(DIM.beamEnd - 1.2, 18);
  beamShape.quadraticCurveTo(DIM.beamEnd, 18, DIM.beamEnd, 16.8);
  beamShape.lineTo(DIM.beamEnd, 1.2);
  beamShape.quadraticCurveTo(DIM.beamEnd, 0, DIM.beamEnd - 1.2, 0);
  beamShape.lineTo(DIM.faceX, 0);
  beamShape.lineTo(DIM.faceX, -40.5);
  beamShape.lineTo(DIM.faceX - 0.55, DIM.jawTip);
  beamShape.lineTo(-9.2, -36.5);
  beamShape.lineTo(-15.2, -11.5);
  beamShape.quadraticCurveTo(-16.6, -6.2, -22, -5.2);
  beamShape.lineTo(-30, -4.6);
  beamShape.quadraticCurveTo(-34, -4.3, -34, -0.5);
  beamShape.lineTo(-34, 13);
  beamShape.quadraticCurveTo(-34, 18, -29, 18);
  fixed.add(mesh(extrude(beamShape, -DIM.beamHalfT, DIM.beamHalfT, 0.32), M.steel, 'Beam'));

  // Fixed inside jaw (thin blade in the back half, so the slider's blade can cross it when closed).
  const fixedBlade = new THREE.Shape();
  fixedBlade.moveTo(-17, 17);
  fixedBlade.quadraticCurveTo(-10.5, 21.5, DIM.innerX, DIM.innerTip[0]);
  fixedBlade.lineTo(DIM.innerX, DIM.innerTip[1]);
  fixedBlade.lineTo(DIM.innerX + 1.25, 37.3);
  fixedBlade.lineTo(DIM.innerX + 2.5, DIM.innerTip[1] + 0.2);
  fixedBlade.lineTo(-5.4, 17);
  fixedBlade.lineTo(-17, 17);
  fixed.add(mesh(extrude(fixedBlade, -1.85, -0.25, 0.14), M.steel, 'FixedInsideJaw'));

  // Satin scale band + main-scale ticks and numbers.
  const bandZ = DIM.beamHalfT + 0.004;
  const band = mesh(new THREE.PlaneGeometry(DIM.scaleEnd + 4.5, 9.6), M.satin, 'MainScaleBand');
  band.geometry.translate(DIM.scaleEnd / 2 + 0.75, DIM.scaleY + 4.8, bandZ);
  band.material.polygonOffset = true;
  band.material.polygonOffsetFactor = -1;
  band.material.polygonOffsetUnits = -1;
  fixed.add(band);

  const mainCount = DIM.scaleEnd + 1;
  const mainTicks = tickMesh(mainCount, M.ink, 'MainScaleTicks');
  const mainTickH = (i) => (i % 10 === 0 ? 4.1 : i % 5 === 0 ? 3.0 : 2.0);
  const tmp = new THREE.Object3D();
  const setMainTick = (i, widthScale = 1) => {
    const h = mainTickH(i);
    tmp.position.set(i, DIM.scaleY + h / 2, DIM.beamHalfT + 0.012);
    tmp.rotation.set(0, 0, 0);
    tmp.scale.set(TICK_W * widthScale, h, 1);
    tmp.updateMatrix();
    mainTicks.setMatrixAt(i, tmp.matrix);
  };
  for (let i = 0; i < mainCount; i++) setMainTick(i);
  fixed.add(mainTicks);

  for (let cm = 0; cm <= DIM.scaleEnd / 10; cm++) {
    const label = textMesh(T.digits(cm), 3.0, { aniso: M.aniso });
    label.position.set(cm * 10, 13.55, DIM.beamHalfT + 0.012);
    fixed.add(label);
  }
  const unitLabel = textMesh(T.cm, 2.2, { aniso: M.aniso, align: 'left', weight: 500 });
  unitLabel.position.set(DIM.scaleEnd + 3, 13.4, DIM.beamHalfT + 0.012);
  fixed.add(unitLabel);
  const brand = textMesh(T.brand, 2.5, { aniso: M.aniso, align: 'right', weight: 600, color: '#3b4048' });
  brand.position.set(DIM.beamEnd - 6, 4.1, DIM.beamHalfT + 0.012);
  fixed.add(brand);
  const range = textMesh(T.range, 1.7, { aniso: M.aniso, align: 'right', weight: 500, color: '#4a5059' });
  range.position.set(DIM.beamEnd - 6, 1.6, DIM.beamHalfT + 0.012);
  fixed.add(range);

  // ── slider ────────────────────────────────────────────────────────────────────
  const S0 = DIM.sliderStart;
  const S1 = DIM.sliderEnd;
  const P = DIM.plateZ;
  const sliderMeshes = [];
  const addSlider = (m) => {
    slider.add(m);
    sliderMeshes.push(m);
    return m;
  };

  // Vernier plate with a bevelled top edge: the vernier ticks sit almost in the main-scale plane,
  // which is how real calipers keep parallax small.
  addSlider(
    mesh(
      prismX(
        [
          [DIM.beamHalfT + 0.05, -6],
          [P, -6],
          [P, DIM.chamferBottom],
          [DIM.bevelBottom[1], DIM.bevelBottom[0]],
          [DIM.bevelTop[1], DIM.bevelTop[0]],
          [DIM.beamHalfT + 0.05, DIM.bevelTop[0]],
        ],
        S0,
        S1,
        0.06,
      ),
      M.satinSlider,
      'VernierPlate',
    ),
  );
  addSlider(mesh(rbox(S0, S0 + 1.5, DIM.scaleY - 0.2, DIM.beamTop + 0.3, DIM.beamHalfT + 0.05, P, 0.3), M.sliderSteel, 'WindowLeft'));
  addSlider(mesh(rbox(54, S1, DIM.scaleY - 0.2, DIM.beamTop + 0.3, DIM.beamHalfT + 0.05, P, 0.5), M.sliderSteel, 'WindowRight'));
  addSlider(mesh(rbox(S0, S1, DIM.beamTop + 0.05, 23.5, -P, P, 0.9), M.sliderSteel, 'TopBar'));
  addSlider(mesh(rbox(S0, S1, -6, -0.05, -P, P - 0.02, 0.7), M.sliderSteel, 'BottomBar'));
  addSlider(mesh(rbox(S0, S1, -6, 23.5, -P, -DIM.beamHalfT - 0.05, 0.6), M.sliderSteel, 'BackPlate'));

  const sliderJaw = new THREE.Shape();
  sliderJaw.moveTo(DIM.faceX, -4.5);
  sliderJaw.lineTo(DIM.faceX, -40.5);
  sliderJaw.lineTo(DIM.faceX + 0.55, DIM.jawTip);
  sliderJaw.lineTo(1.2, -36.5);
  sliderJaw.lineTo(7.2, -11.5);
  sliderJaw.quadraticCurveTo(8.6, -6.6, 14, -5.6);
  sliderJaw.lineTo(24, -4.5);
  sliderJaw.lineTo(DIM.faceX, -4.5);
  addSlider(mesh(extrude(sliderJaw, -DIM.beamHalfT, DIM.beamHalfT, 0.32), M.sliderSteel, 'SliderOutsideJaw'));

  const sliderBlade = new THREE.Shape();
  sliderBlade.moveTo(S0, 22);
  sliderBlade.lineTo(4.5, 22);
  sliderBlade.quadraticCurveTo(-3.5, 23.5, DIM.innerX, DIM.innerTip[0]);
  sliderBlade.lineTo(DIM.innerX, DIM.innerTip[1]);
  sliderBlade.lineTo(DIM.innerX - 1.25, 37.3);
  sliderBlade.lineTo(DIM.innerX - 2.5, DIM.innerTip[1] + 0.2);
  sliderBlade.quadraticCurveTo(-9.3, 25, S0, 22);
  addSlider(mesh(extrude(sliderBlade, 0.25, 1.85, 0.14), M.sliderSteel, 'SliderInsideJaw'));

  // Depth rod: rides behind the beam and leaves its end by exactly `gap`.
  addSlider(
    mesh(
      rbox(52, DIM.beamEnd, DIM.rodY - DIM.rodHalfH, DIM.rodY + DIM.rodHalfH, DIM.rodZ - DIM.rodHalfT, DIM.rodZ + DIM.rodHalfT, 0.2),
      M.sliderSteel,
      'DepthRod',
    ),
  );

  // Thumb roller for fine adjustment.
  const roller = new THREE.Group();
  roller.name = 'ThumbRoller';
  roller.position.set(57, -8.6, 0);
  const wheel = mesh(extrude(knurlShape(DIM.rollerR, 44, 0.32), -1.7, 1.7, 0.12, 2), M.knurl, 'RollerWheel');
  const cap = new THREE.CylinderGeometry(1.4, 1.4, 4.6, 32);
  cap.rotateX(Math.PI / 2);
  roller.add(wheel, mesh(cap, M.chrome, 'RollerAxle'));
  addSlider(roller);
  addSlider(mesh(rbox(51.5, S1, -9.2, -5.5, -P, -1.9, 0.5), M.sliderSteel, 'RollerBracket'));

  // Locking screw on the top bar.
  const lock = new THREE.Group();
  lock.name = 'LockScrew';
  lock.position.set(34, 23.5, 0);
  const stem = new THREE.CylinderGeometry(1.25, 1.25, 1.4, 24);
  stem.translate(0, 0.7, 0);
  const headGeo = extrude(knurlShape(3.1, 30, 0.28), 0, 3.2, 0.14, 2);
  headGeo.rotateX(-Math.PI / 2);
  headGeo.translate(0, 1.3, 0);
  const lockHead = mesh(headGeo, M.knurl, 'LockHead');
  const lockTop = new THREE.CylinderGeometry(2.3, 2.6, 0.5, 40);
  lockTop.translate(0, 4.75, 0);
  lock.add(mesh(stem, M.chrome, 'LockStem'), lockHead, mesh(lockTop, M.chrome, 'LockCap'));
  addSlider(lock);

  // ── vernier scale (rebuilt when the least count changes) ─────────────────────
  const vernier = new THREE.Group();
  vernier.name = 'VernierScale';
  slider.add(vernier);
  let vernierTicks = null;
  let lcLabel = null;
  let n = divisionsFor(lc);

  const bevelDir = new THREE.Vector3(0, -(DIM.bevelTop[0] - DIM.bevelBottom[0]), DIM.bevelBottom[1] - DIM.bevelTop[1]).normalize();
  const bevelNormal = new THREE.Vector3(0, -bevelDir.z, bevelDir.y).negate();
  if (bevelNormal.z < 0) bevelNormal.negate();

  function labelEvery(divs) {
    return divs === 10 ? 5 : divs === 20 ? 4 : 5;
  }
  function vernierTickLen(k) {
    const m = labelEvery(n);
    if (k % m === 0) return 2.7;
    if (m % 2 === 0 && k % (m / 2) === 0) return 2.2;
    return 1.8;
  }
  const setVernierTick = (k, widthScale = 1) => {
    const len = vernierTickLen(k);
    const vsd = (n - 1) / n;
    tmp.position
      .set(k * vsd, DIM.bevelTop[0], DIM.bevelTop[1])
      .addScaledVector(bevelDir, len / 2)
      .addScaledVector(bevelNormal, 0.012);
    tmp.rotation.set(-BEVEL_ANGLE, 0, 0);
    tmp.scale.set(TICK_W * widthScale, len, 1);
    tmp.updateMatrix();
    vernierTicks.setMatrixAt(k, tmp.matrix);
  };

  function buildVernier() {
    for (const child of [...vernier.children]) {
      vernier.remove(child);
      if (child.userData.keep) continue;
      if (child.isInstancedMesh) child.dispose();
      else {
        child.geometry.dispose();
        child.material.dispose();
      }
    }
    n = divisionsFor(lc);
    vernierTicks = tickMesh(n + 1, M.ink, 'VernierTicks');
    for (let k = 0; k <= n; k++) setVernierTick(k);
    vernier.add(vernierTicks);
    const every = labelEvery(n);
    for (let k = 0; k <= n; k += every) {
      const label = textMesh(T.digits((k * 10) / n), 2.5, { aniso: M.aniso });
      label.position.set((k * (n - 1)) / n, 1.2, P + 0.012);
      vernier.add(label);
    }
    lcLabel = textMesh(`${T.digits(lc)} ${T.mm}`, 1.9, { aniso: M.aniso, weight: 600, align: 'right', color: '#2c3138' });
    lcLabel.position.set(S1 - 2.5, -3.1, P + 0.012);
    slider.add(lcLabel);
    vernier.userData.lcLabel = lcLabel;
  }
  buildVernier();

  // ── highlights ────────────────────────────────────────────────────────────────
  // Glow strips make the important lines visible even when ticks are thinner than a pixel.
  function glowStrip(color, h) {
    const g = new THREE.PlaneGeometry(0.75, h);
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 8, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 64);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color, map: tex, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }),
    );
    m.renderOrder = 3;
    m.visible = false;
    m.userData.keep = true;
    return m;
  }
  // Main-scale glows lie on the beam face; vernier glows lie on the bevel like the ticks do.
  const placeOnBevel = (m, len) => {
    m.position
      .set(0, DIM.bevelTop[0], DIM.bevelTop[1])
      .addScaledVector(bevelDir, len / 2)
      .addScaledVector(bevelNormal, 0.03);
    m.rotation.set(-BEVEL_ANGLE, 0, 0);
  };
  const glowCoincide = glowStrip(HIGHLIGHT.coincide, 5.4);
  glowCoincide.name = 'CoincidenceGlowMain';
  glowCoincide.geometry.translate(0, 2.7, 0);
  const glowCoincideV = glowStrip(HIGHLIGHT.coincide, 3.1);
  glowCoincideV.name = 'CoincidenceGlowVernier';
  placeOnBevel(glowCoincideV, 3.1);
  const glowMsr = glowStrip(HIGHLIGHT.msr, 5.4);
  glowMsr.name = 'MsrGlow';
  glowMsr.geometry.translate(0, 2.7, 0);
  const glowZero = glowStrip(HIGHLIGHT.zero, 3.1);
  glowZero.name = 'ZeroGlow';
  placeOnBevel(glowZero, 3.1);
  fixed.add(glowCoincide, glowMsr);
  vernier.add(glowZero, glowCoincideV);

  let lit = { main: [], vernier: [] };
  function clearHighlights() {
    for (const i of lit.main) {
      mainTicks.setColorAt(i, INK);
      setMainTick(i);
    }
    for (const k of lit.vernier) {
      if (k <= n) {
        vernierTicks.setColorAt(k, INK);
        setVernierTick(k);
      }
    }
    lit = { main: [], vernier: [] };
    glowCoincide.visible = glowCoincideV.visible = glowMsr.visible = glowZero.visible = false;
  }

  /**
   * Colour specific lines. Any of: { msr: mmIndex, zero: true, coincide: { main, vernier }, scan: k }.
   */
  function highlight(spec = {}) {
    clearHighlights();
    const litMain = (i, color, w = 2.2) => {
      if (i < 0 || i >= mainCount) return;
      mainTicks.setColorAt(i, color);
      setMainTick(i, w);
      lit.main.push(i);
    };
    const litVernier = (k, color, w = 2.2) => {
      if (k < 0 || k > n) return;
      vernierTicks.setColorAt(k, color);
      setVernierTick(k, w);
      lit.vernier.push(k);
    };
    if (spec.msr != null && spec.msr >= 0) {
      litMain(spec.msr, HIGHLIGHT.msr);
      glowMsr.visible = true;
      glowMsr.position.set(spec.msr, DIM.scaleY, DIM.beamHalfT + 0.03);
    }
    if (spec.zero) {
      litVernier(0, HIGHLIGHT.zero);
      glowZero.visible = true;
      glowZero.position.x = 0;
    }
    if (spec.coincide) {
      litMain(spec.coincide.main, HIGHLIGHT.coincide);
      litVernier(spec.coincide.vernier, HIGHLIGHT.coincide);
      glowCoincide.visible = glowCoincideV.visible = true;
      glowCoincide.position.set(spec.coincide.main, DIM.scaleY, DIM.beamHalfT + 0.03);
      glowCoincideV.position.x = (spec.coincide.vernier * (n - 1)) / n;
    }
    if (spec.scan != null) litVernier(spec.scan, HIGHLIGHT.scan, 2.6);
    if (spec.mainExtra) for (const i of spec.mainExtra) litMain(i, spec.mainExtraColor || HIGHLIGHT.scan, 2.2);
    if (spec.vernierExtra) for (const k of spec.vernierExtra) litVernier(k, spec.vernierExtraColor || HIGHLIGHT.scan, 2.2);
    mainTicks.instanceMatrix.needsUpdate = true;
    vernierTicks.instanceMatrix.needsUpdate = true;
    if (mainTicks.instanceColor) mainTicks.instanceColor.needsUpdate = true;
    if (vernierTicks.instanceColor) vernierTicks.instanceColor.needsUpdate = true;
  }

  // ── state ─────────────────────────────────────────────────────────────────────
  const state = { gap: 0, zeroError, lockAngle: 0 };

  function setGap(gap) {
    state.gap = gap;
    slider.position.x = gap;
    roller.rotation.z = -gap / DIM.rollerR;
  }
  function setZeroError(e) {
    state.zeroError = e;
    vernier.position.x = e;
  }
  function setLeastCount(value) {
    lc = value;
    clearHighlights();
    if (lcLabel) {
      slider.remove(lcLabel);
      lcLabel.geometry.dispose();
      lcLabel.material.dispose();
    }
    buildVernier();
    vernier.add(glowZero, glowCoincideV);
  }
  function setLockAngle(a) {
    state.lockAngle = a;
    lock.rotation.y = a;
  }

  setGap(0);
  setZeroError(zeroError);

  // Points of interest, in caliper (root) space. Convert with root.localToWorld when needed.
  const points = {
    mainTick: (i) => new THREE.Vector3(i, DIM.scaleY + 1.5, DIM.beamHalfT),
    vernierTick: (k) => new THREE.Vector3(state.gap + state.zeroError + (k * (n - 1)) / n, DIM.scaleY - 1, DIM.bevelTop[1] + 0.4),
    vernierZero: () => new THREE.Vector3(state.gap + state.zeroError, DIM.scaleY, DIM.bevelTop[1]),
    scaleCenter: () => new THREE.Vector3(state.gap + state.zeroError + (n - 1) / 2, DIM.scaleY, DIM.beamHalfT),
    mainScale: () => new THREE.Vector3(150, DIM.scaleY + 6, DIM.beamHalfT),
    vernierScale: () => new THREE.Vector3(state.gap + 30, 1, P),
    outsideJaws: () => new THREE.Vector3(DIM.faceX - 3, -30, DIM.beamHalfT),
    insideJaws: () => new THREE.Vector3(DIM.innerX + 0.5, 34, 0),
    depthRod: () => new THREE.Vector3(DIM.beamEnd + Math.max(state.gap, 0) - 0.5, DIM.rodY, DIM.rodZ),
    lockScrew: () => new THREE.Vector3(state.gap + 34, 28, 0),
    roller: () => new THREE.Vector3(state.gap + 57, -12, 1.7),
    beamEnd: () => new THREE.Vector3(DIM.beamEnd, DIM.rodY, 0),
  };

  return {
    root,
    fixed,
    slider,
    vernier,
    roller,
    lock,
    sliderMeshes,
    fixedMeshes: fixed.children.filter((c) => c.isMesh && !c.isInstancedMesh),
    lockMeshes: lock.children,
    state,
    get divisions() {
      return n;
    },
    setGap,
    setZeroError,
    setLeastCount,
    setLockAngle,
    highlight,
    clearHighlights,
    points,
  };
}
