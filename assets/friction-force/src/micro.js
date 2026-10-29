// Enlarged, schematic contact: rough solids with attached particle markers.
// Rubbing changes relative surface motion and qualitative warmth, not a numerical temperature.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { textMesh } from '@shared/student/materials.js';
import { TEETH, climb, gapOf, teethY } from './physics.js';
export const MICRO_COLORS = { table: '#338d2e', block: '#08799a', weight: '#c4a0ff', heat: '#ff6b3d', field: 0x092c48 };
const SPAN = 12,
  TOP = 2.15,
  BOTTOM = -1.45,
  DEPTH = 0.6;
const base = [];
for (let k = Math.floor(-SPAN / TEETH.period) - 1; k <= Math.ceil(SPAN / TEETH.period) + 1; k++)
  for (const [cx, cy] of TEETH.corners) {
    const x = k * TEETH.period + cx;
    if (x >= -SPAN && x <= SPAN && (!base.length || Math.abs(base.at(-1)[0] - x) > 1e-8)) base.push([x, cy]);
  }
const extrude = (shape) => new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false, steps: 1 }).translate(0, 0, -DEPTH / 2);
function roundedPlane() {
  const s = new THREE.Shape(),
    r = 0.04;
  s.moveTo(-0.5 + r, -0.5);
  s.lineTo(0.5 - r, -0.5);
  s.quadraticCurveTo(0.5, -0.5, 0.5, -0.5 + r);
  s.lineTo(0.5, 0.5 - r);
  s.quadraticCurveTo(0.5, 0.5, 0.5 - r, 0.5);
  s.lineTo(-0.5 + r, 0.5);
  s.quadraticCurveTo(-0.5, 0.5, -0.5, 0.5 - r);
  s.lineTo(-0.5, -0.5 + r);
  s.quadraticCurveTo(-0.5, -0.5, -0.5 + r, -0.5);
  const g = new THREE.ShapeGeometry(s);
  const p = g.attributes.position,
    u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) + 0.5, p.getY(i) + 0.5);
  return g;
}
export function createLens({ stage, t }) {
  const { renderer } = stage,
    micro = new THREE.Scene();
  micro.add(new THREE.HemisphereLight(0xffffff, 0x173051, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(-4, 6, 8);
  micro.add(sun);
  const cam = new THREE.OrthographicCamera(-7, 7, 2.7, -2.7, 0.1, 30);
  cam.position.set(0, 0.85, 12);
  cam.lookAt(0, 0.85, 0);
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
  const lowerMat = mat(MICRO_COLORS.table),
    upperMat = mat(MICRO_COLORS.block),
    hot = new THREE.Color(MICRO_COLORS.heat);
  const lowerShape = new THREE.Shape();
  lowerShape.moveTo(-SPAN, BOTTOM);
  lowerShape.lineTo(SPAN, BOTTOM);
  for (const p of [...base].reverse()) lowerShape.lineTo(...p);
  const lower = new THREE.Mesh(extrude(lowerShape), lowerMat),
    upper = new THREE.Mesh(new THREE.BufferGeometry(), upperMat);
  lower.name = 'LowerRoughSurface';
  upper.name = 'UpperRoughSurface';
  micro.add(lower, upper);
  let built = -1;
  function buildUpper(bite) {
    if (Math.abs(built - bite) < 0.003) return;
    built = bite;
    const shape = new THREE.Shape();
    shape.moveTo(-SPAN, TOP);
    shape.lineTo(SPAN, TOP);
    for (const [x, y] of [...base].reverse()) shape.lineTo(x, y + gapOf(bite));
    upper.geometry.dispose();
    upper.geometry = extrude(shape);
  }
  const beadGeo = new THREE.SphereGeometry(0.095, 10, 6),
    upperBead = mat('#19dce9'),
    lowerBead = mat('#7fe237');
  function particles(parent, material, top) {
    const points = [];
    for (let x = -SPAN + 0.16; x < SPAN - 0.1; x += 0.31)
      for (let y = top ? 0.35 : -1.2; y <= (top ? 2.0 : 0.65); y += 0.29)
        if (top ? y > teethY(x) + 0.44 : y < teethY(x) - 0.14) points.push(new THREE.Vector3(x, y, DEPTH / 2 + 0.055));
    const mesh = new THREE.InstancedMesh(beadGeo, material, points.length);
    mesh.name = top ? 'UpperAttachedParticles' : 'LowerAttachedParticles';
    parent.add(mesh);
    return { mesh, points };
  }
  const up = particles(upper, upperBead, true),
    down = particles(lower, lowerBead, false),
    matrix = new THREE.Matrix4();
  const label = (key, color) => {
    const m = textMesh(t(key), 0.42, { color, weight: 700 });
    m.position.z = 0.7;
    micro.add(m);
    return m;
  };
  const blockWord = label('l_block_word', '#b0f6ff'),
    tableWord = label('l_table_word', '#c2ffa4'),
    warmWord = label('micro_warm', '#ffffff');
  const press = createArrow({ color: MICRO_COLORS.weight, radius: 0.04, head: 0.23, headRadius: 0.11, name: 'ContactPressure' });
  micro.add(press.root);
  const pressureWord = label('l_weight_short', '#d7bfff');
  // A qualitative warmth indicator, deliberately without degrees or a scale.
  const gauge = new THREE.Group();
  gauge.name = 'QualitativeWarmth';
  micro.add(gauge);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.45, 5.5, 0.1), new THREE.MeshBasicMaterial({ color: MICRO_COLORS.field }));
  plate.position.set(0, 0.8, 0.55);
  gauge.add(plate);
  const glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 2.7, 5, 12), new THREE.MeshBasicMaterial({ color: '#f5f8fc' }));
  glass.position.set(0, 0.9, 0.72);
  gauge.add(glass);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1, 12), new THREE.MeshBasicMaterial({ color: '#ff4069' }));
  gauge.add(liquid);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 12), mat('#ff4069'));
  bulb.position.set(0, -0.7, 0.78);
  gauge.add(bulb);
  const rt = new THREE.WebGLRenderTarget(512, 180, { samples: 0 });
  const overlay = new THREE.Scene(),
    ocam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const geo = roundedPlane();
  const flat = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  const rim = new THREE.Mesh(geo, flat('#ffe49c')),
    disc = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
    );
  rim.renderOrder = 3;
  disc.renderOrder = 4;
  const connector = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 4 }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: '#ffe49c', transparent: true, opacity: 0.65, depthTest: false }),
  );
  connector.renderOrder = 2;
  const spot = new THREE.Mesh(new THREE.RingGeometry(0.62, 1, 20), flat('#ffe49c'));
  spot.renderOrder = 5;
  overlay.add(rim, disc, connector, spot);
  const s = { k: 0, cx: 0, cy: 0, w: 200, h: 100, from: { x: 0, y: 0 } };
  let lastKey = '';
  const api = {
    place({ cx, cy, d = 200, w = d, h = d * 0.4, from, k }) {
      Object.assign(s, { cx, cy, w, h, from, k });
    },
    get k() {
      return s.k;
    },
    get box() {
      return { left: s.cx - s.w / 2, top: s.cy - s.h / 2, right: s.cx + s.w / 2, bottom: s.cy + s.h / 2 };
    },
    set({ bite = 0.45, shear = 0, weight = 19.6, heat = 0, labels = true, time = 0 }) {
      const key = [s.w, s.h, bite, shear, weight, heat, labels, heat > 0 ? time : 0].join(',');
      if (key === lastKey) return;
      lastKey = key;
      buildUpper(bite);
      upper.position.y = climb(shear, bite);
      lower.position.x = -shear;
      for (const entry of [up, down]) {
        entry.points.forEach((point, i) => {
          const a = 0.018 * heat;
          matrix.makeTranslation(point.x + a * Math.sin(time * 17 + i * 1.7), point.y + a * Math.cos(time * 19 + i * 2.1), point.z);
          entry.mesh.setMatrixAt(i, matrix);
        });
        entry.mesh.instanceMatrix.needsUpdate = true;
      }
      upperMat.emissive.copy(hot).multiplyScalar(0.25 * heat);
      lowerMat.emissive.copy(hot).multiplyScalar(0.25 * heat);
      const right = (2.7 * s.w) / Math.max(1, s.h);
      gauge.position.x = right - 0.8;
      warmWord.position.set(right - 0.8, -1.3, 0.9);
      const level = 0.2 + 2.25 * heat;
      liquid.scale.y = level;
      liquid.position.set(0, -0.6 + level / 2, 0.8);
      bulb.material.emissive.copy(hot).multiplyScalar(heat * 0.35);
      blockWord.position.set(-right + 2, 2.65, 0.8);
      tableWord.position.set(-right + 2, -1.6, 0.8);
      pressureWord.position.set(right - 2.6, 2.75, 0.8);
      press.set(new THREE.Vector3(right - 2.6, 2.6 + weight * 0.012, 0.6), new THREE.Vector3(0, -1, 0), weight * 0.012 + 0.25);
      for (const word of [blockWord, tableWord, pressureWord, warmWord]) word.visible = labels;
    },
    dispose() {
      rt.dispose();
      unAfter();
    },
  };
  function drawOverlay() {
    if (s.k <= 0.01) return;
    const w = s.w * (0.8 + 0.2 * s.k),
      h = s.h * (0.8 + 0.2 * s.k),
      dpr = renderer.getPixelRatio();
    const rw = Math.min(1200, Math.round(w * dpr)),
      rh = Math.min(420, Math.round(h * dpr));
    if (rt.width !== rw || rt.height !== rh) rt.setSize(rw, rh);
    const half = (2.7 * w) / h;
    cam.left = -half;
    cam.right = half;
    cam.updateProjectionMatrix();
    const target = renderer.getRenderTarget(),
      color = renderer.getClearColor(new THREE.Color()),
      alpha = renderer.getClearAlpha(),
      auto = renderer.autoClear;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(MICRO_COLORS.field, 1);
    renderer.clear();
    renderer.render(micro, cam);
    renderer.setRenderTarget(target);
    renderer.setClearColor(color, alpha);
    ocam.right = stage.width;
    ocam.bottom = -stage.height;
    ocam.updateProjectionMatrix();
    disc.position.set(s.cx, -s.cy, 0);
    disc.scale.set(w, h, 1);
    rim.position.copy(disc.position);
    rim.scale.set(w + 5, h + 5, 1);
    spot.position.set(s.from.x, -s.from.y, 0);
    spot.scale.setScalar(5);
    const positions = connector.geometry.attributes.position;
    positions.setXYZ(0, s.from.x, -s.from.y, 0);
    positions.setXYZ(1, s.cx - w * 0.3, -s.cy + h / 2, 0);
    positions.setXYZ(2, s.from.x, -s.from.y, 0);
    positions.setXYZ(3, s.cx + w * 0.3, -s.cy + h / 2, 0);
    positions.needsUpdate = true;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, ocam);
    renderer.autoClear = auto;
  }
  const unAfter = stage.onAfterRender(drawOverlay);
  api.set({});
  return api;
}
