// The zoom-in on the touching place (the book's চিত্র ৩.১৬): a round window under the table joined by a cone to the
// spot where the block touches the table. Inside, the two surfaces drawn far bigger than life, as a cut through
// them: the table's top (below) and the block's bottom (above) are both rough, and their teeth lock into each
// other's grooves. More weight: the block's teeth sink deeper into the grooves. A push: the block's teeth lean on the
// table's (and when it slides, ride up over them and drop into the next grooves). Rubbing warms both (they glow).
//
// It is drawn into the same canvas as the scene (a second render of its own little scene into a texture, shown as a
// disc over the canvas, as the kit's magnifier does), so every capture and the poster show it too.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { textMesh } from '@shared/student/materials.js';
import { TEETH, climb, gapOf } from './physics.js';

const SPAN = 4.8; // half-width of the two bodies (teeth units: one tooth period is 1.6)
const DEPTH = 1.0; // how thick they are into the screen
const THICK = 1.2; // the table's body below its teeth
const TOP = 1.2; // the block's top
const FRAME = { x: 1.55, y0: -0.55, y1: 2.55 }; // what the window shows
export const MICRO_COLORS = { table: '#9a6234', block: '#e6c28c', weight: '#7048e8', heat: '#ff6a2b', field: 0xf7f3ec };

/** The table's surface as corners from x0 to x1 (the teeth repeat every period). */
function profile(x0, x1) {
  const pts = [];
  const p = TEETH.period;
  for (let k = Math.floor(x0 / p) - 1; k <= Math.ceil(x1 / p) + 1; k++)
    for (const [cx, cy] of TEETH.corners) {
      const x = k * p + cx;
      if (x < x0 - 1e-9 || x > x1 + 1e-9) continue;
      if (pts.length && Math.abs(pts[pts.length - 1][0] - x) < 1e-9) continue;
      pts.push([x, cy]);
    }
  return pts;
}
export function createLens({ stage, t }) {
  const { renderer, scene: mainScene } = stage;

  // ── the little scene ──
  const micro = new THREE.Scene();
  micro.environment = mainScene.environment;
  micro.environmentIntensity = 0.75;
  micro.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 6, 8);
  micro.add(sun);
  const cam = new THREE.PerspectiveCamera(16, 1, 1, 80);
  const focus = new THREE.Vector3(0, (FRAME.y0 + FRAME.y1) / 2, 0);
  cam.position.set(-0.7, focus.y + 0.8, (FRAME.y1 - FRAME.y0) / 2 / Math.tan(THREE.MathUtils.degToRad(8)));
  cam.lookAt(focus);

  const lowerMat = new THREE.MeshStandardMaterial({ color: MICRO_COLORS.table, roughness: 0.85, metalness: 0 });
  const upperMat = new THREE.MeshStandardMaterial({ color: MICRO_COLORS.block, roughness: 0.8, metalness: 0 });
  const warm = new THREE.Color(MICRO_COLORS.heat);

  const base = profile(-SPAN, SPAN);
  const lowerShape = new THREE.Shape();
  lowerShape.moveTo(-SPAN, -THICK);
  lowerShape.lineTo(SPAN, -THICK);
  for (let i = base.length - 1; i >= 0; i--) lowerShape.lineTo(base[i][0], base[i][1]);
  const extrude = (shape) => new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -DEPTH / 2);
  const lower = new THREE.Mesh(extrude(lowerShape), lowerMat);
  micro.add(lower);

  const upper = new THREE.Mesh(new THREE.BufferGeometry(), upperMat);
  micro.add(upper);
  let built = -1;
  function buildUpper(bite) {
    if (Math.abs(bite - built) < 0.004) return;
    built = bite;
    const gap = gapOf(bite);
    const bottom = base.map(([x, y]) => [x, y + gap]);
    const shape = new THREE.Shape();
    shape.moveTo(-SPAN, TOP);
    shape.lineTo(SPAN, TOP);
    for (let i = bottom.length - 1; i >= 0; i--) shape.lineTo(bottom[i][0], bottom[i][1]);
    upper.geometry.dispose();
    upper.geometry = extrude(shape);
  }

  // which is which: the block above (its name moves with it), the table below
  const tag = (text, color, x, y) => {
    const label = textMesh(text, 0.34, { color, weight: 700 });
    label.position.set(x, y, DEPTH / 2 + 0.03);
    return label;
  };
  upper.add(tag(t('l_block_word'), '#6b4513', -0.55, 0.95));
  micro.add(tag(t('l_table_word'), '#ffffff', 0, -0.25));

  // a glowing line along the touching surfaces (shows when they warm up)
  const glowMat = new THREE.MeshBasicMaterial({ color: MICRO_COLORS.heat, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const glow = (() => {
    const pos = [];
    const idx = [];
    const win = base.filter(([x]) => Math.abs(x) <= SPAN - 0.2);
    win.forEach(([x, y], i) => {
      pos.push(x, y - 0.07, DEPTH / 2 + 0.01, x, y + 0.07, DEPTH / 2 + 0.01);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return new THREE.Mesh(g, glowMat);
  })();
  lower.add(glow); // the lit line follows the table's teeth

  // the weight pressing down on the block (the book: weight and friction are at right angles)
  const press = createArrow({ color: MICRO_COLORS.weight, radius: 0.06, head: 0.36, headRadius: 0.16, name: 'WeightArrow' });
  upper.add(press.root); // the weight presses on the block, so it rides up with it
  const pressText = textMesh(t('l_weight_short'), 0.34, { color: '#5b3fc9', weight: 700, align: 'left' });
  upper.add(pressText);

  // ── the window over the canvas: the little scene as a disc, a ring, and a cone to the touching spot ──
  const rt = new THREE.WebGLRenderTarget(512, 512, { samples: 4, type: THREE.HalfFloatType });
  const overlay = new THREE.Scene();
  const ocam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 96),
    new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, depthTest: false, depthWrite: false }),
  );
  disc.renderOrder = 3;
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
  const rimMat = flat('#c2791c');
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.478, 0.5, 96), rimMat);
  rim.renderOrder = 4;
  const coneGeo = new THREE.BufferGeometry();
  coneGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
  const coneMat = flat('#f59f00', 0.2);
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.renderOrder = 1;
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: '#c2791c', transparent: true, opacity: 0.8, depthTest: false, toneMapped: false });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.renderOrder = 2;
  const spotMat = flat('#c2791c');
  const spot = new THREE.Mesh(new THREE.RingGeometry(0.62, 1, 24), spotMat);
  spot.renderOrder = 4;
  overlay.add(cone, edges, disc, rim, spot);

  const s = { k: 0, cx: 0, cy: 0, d: 120, from: { x: 0, y: 0 } };
  let placed = '';
  let drawn = '';
  const api = {
    /** The window (centre and diameter) and the spot it points at, in canvas pixels; k: 0…1 how far open. */
    place({ cx, cy, d, from, k }) {
      const key = [cx, cy, d, from.x, from.y, k].map((v) => Math.round(v * 10)).join();
      if (key === placed) return;
      placed = key;
      Object.assign(s, { cx, cy, d, from, k });
      stage.invalidate();
    },
    get k() {
      return s.k;
    },
    get box() {
      const r = (s.d * Math.max(0.01, s.k)) / 2;
      return { left: s.cx - r, top: s.cy - r, right: s.cx + r, bottom: s.cy + r };
    },
    /**
     * bite: how deep the teeth have sunk (0…1); shear: how far the block's teeth lean on the table's (teeth units),
     * or slide: how far it has slid (rides over the teeth); weight: N for the arrow; heat 0…1.
     */
    set({ bite, shear = 0, weight = 0, heat = 0 }) {
      const key = [bite, shear, weight, heat].map((v) => Math.round(v * 1000)).join();
      if (key === drawn) return;
      drawn = key;
      buildUpper(bite);
      const g = climb(((shear % TEETH.period) + TEETH.period) % TEETH.period, bite, 0.02);
      lower.position.set(-shear, -g, 0); // the block stays put in the window (with its weight arrow); the table slides and drops away beneath it
      upper.material.emissive.copy(warm).multiplyScalar(0.3 * heat);
      lowerMat.emissive.copy(warm).multiplyScalar(0.3 * heat);
      glowMat.opacity = 0.85 * heat;
      const len = 0.022 * weight;
      press.set(new THREE.Vector3(0, TOP + len + 0.06, 0), new THREE.Vector3(0, -1, 0), len);
      pressText.position.set(0.26, TOP + 0.06 + len / 2, 0.1);
      pressText.visible = weight > 0;
      stage.invalidate();
    },
    dispose() {
      rt.dispose();
      unAfter();
    },
  };

  function drawOverlay() {
    const { k, cx, cy, d, from } = s;
    if (k <= 0.01) return;
    const dpr = renderer.getPixelRatio();
    const size = Math.min(1024, Math.round(d * dpr));
    if (rt.width !== size) rt.setSize(size, size);
    cam.aspect = 1;
    cam.updateProjectionMatrix();
    const prevTarget = renderer.getRenderTarget();
    const prevColor = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();
    const prevAuto = renderer.autoClear;
    renderer.setRenderTarget(rt);
    renderer.setClearColor(MICRO_COLORS.field, 1);
    renderer.clear();
    renderer.render(micro, cam);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevColor, prevAlpha);

    ocam.right = stage.width;
    ocam.bottom = -stage.height;
    ocam.updateProjectionMatrix();
    const r = (d * (0.55 + 0.45 * k)) / 2;
    disc.scale.set(2 * r - 4, 2 * r - 4, 1);
    disc.position.set(cx, -cy, 0);
    rim.scale.set(2 * r, 2 * r, 1);
    rim.position.copy(disc.position);
    spot.scale.setScalar(7);
    spot.position.set(from.x, -from.y, 0);
    // the cone: from the touching spot to the two points where lines from it just touch the window
    const dx = cx - from.x;
    const dy = cy - from.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    const half = Math.asin(Math.min(0.98, r / dist));
    const tl = Math.sqrt(Math.max(0, dist * dist - r * r));
    const p1 = [from.x + tl * Math.cos(a - half), from.y + tl * Math.sin(a - half)];
    const p2 = [from.x + tl * Math.cos(a + half), from.y + tl * Math.sin(a + half)];
    coneGeo.attributes.position.array.set([from.x, -from.y, 0, p1[0], -p1[1], 0, p2[0], -p2[1], 0]);
    coneGeo.attributes.position.needsUpdate = true;
    edgeGeo.attributes.position.array.set([from.x, -from.y, 0, p1[0], -p1[1], 0, from.x, -from.y, 0, p2[0], -p2[1], 0]);
    edgeGeo.attributes.position.needsUpdate = true;
    coneMat.opacity = 0.2 * k;
    edgeMat.opacity = 0.8 * k;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, ocam);
    renderer.autoClear = prevAuto;
  }
  const unAfter = stage.onAfterRender(drawOverlay);
  api.set({ bite: 0.45 });
  return api;
}
