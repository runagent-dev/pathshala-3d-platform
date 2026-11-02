// The book's চিত্র ৬.০৪: a rod, a square plate and a cube, each shown twice, cold above (T₁) and heated below (T₂)
// over a flame, the heated one a little bigger. The bodies are the page's light blue with dark edges. Units are
// centimetres; the bench top is y = 0. The heated bodies are drawn `drawnScale` times (reading.js) too big, else
// the growth could not be seen. A thin amber frame, drawn over the heated body, marks the cold size.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createBurner } from './burner.js';
import { QUANTITIES, T1, T2_MAX, drawnScale } from './reading.js';

export const COLUMN_X = { length: -4.7, area: 0, volume: 4.7 };
/** Width, height, depth of the cold body (cm). */
export const DIMS = { length: [3.6, 0.55, 0.55], area: [2.3, 2.3, 0.34], volume: [1.9, 1.9, 1.9] };
const HOT_Y = 3.3; // the floor of the heated row (cm above the bench)
const COLD_Y = 6.8; // the floor of the cold row
// a rod is thin, so it hangs at the middle of its cell; plates and cubes stand on the floor of theirs
const ROD_UP = { hot: 0.75, cold: 1.15 };

/** Twelve thin bars round a box of w × h × d centred on the origin (one geometry). */
function frame(w, h, d, r) {
  const bars = [];
  const add = (sx, sy, sz, x, y, z) => bars.push(new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z));
  for (const y of [-h / 2, h / 2]) for (const z of [-d / 2, d / 2]) add(w + 2 * r, 2 * r, 2 * r, 0, y, z);
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) add(2 * r, h + 2 * r, 2 * r, x, 0, z);
  for (const x of [-w / 2, w / 2]) for (const y of [-h / 2, h / 2]) add(2 * r, 2 * r, d + 2 * r, x, y, 0);
  return mergeGeometries(bars);
}

export function createBodies() {
  const root = new THREE.Group();
  root.name = 'Bodies';
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(unit);
  const copperCold = new THREE.MeshStandardMaterial({ name: 'Solid', color: '#86bfe9', metalness: 0.3, roughness: 0.38 });
  const copperHot = copperCold.clone();
  copperHot.name = 'SolidHot';
  copperHot.emissive = new THREE.Color('#ff4a0e');
  copperHot.emissiveIntensity = 0;
  const edgeMat = new THREE.LineBasicMaterial({ color: '#0d2540', transparent: true, opacity: 0.9 });
  const frameMat = new THREE.MeshBasicMaterial({ name: 'ColdSize', color: '#f2a516', depthTest: false, transparent: true, opacity: 0.95 });

  const groups = {};
  for (const q of QUANTITIES) {
    const [w, h, d] = DIMS[q];
    const x = COLUMN_X[q];
    const g = new THREE.Group();
    g.name = q;
    const make = (name, material) => {
      const m = new THREE.Mesh(unit, material);
      m.name = name;
      m.add(new THREE.LineSegments(edges, edgeMat));
      return m;
    };
    const cold = make('Cold', copperCold);
    cold.scale.set(w, h, d);
    cold.position.set(x, q === 'length' ? COLD_Y + ROD_UP.cold : COLD_Y + h / 2, 0);
    const hot = make('Heated', copperHot);
    const old = new THREE.Mesh(frame(w, h, d, q === 'length' ? 0.03 : 0.04), frameMat);
    old.name = 'Cold size';
    old.renderOrder = 10;
    old.userData.noExport = true;
    old.visible = false;
    old.position.set(x, q === 'length' ? HOT_Y + ROD_UP.hot : HOT_Y + h / 2, 0);
    const burner = createBurner({ height: 1.2, flame: 1.6 });
    burner.root.position.set(x, 0, 0);
    burner.root.userData.noExport = true;
    g.add(cold, hot, old, burner.root);
    root.add(g);
    groups[q] = { cold, hot, old, burner, x, dims: [w, h, d] };
  }

  /** Put every heated body, flame and the cold-size frame in place for T₂ (°C), clock (s), the chosen quantity. */
  function update(t2, time, chosen) {
    const heat = Math.min(1, Math.max(0, (t2 - T1) / (T2_MAX - T1)));
    const s = drawnScale(t2);
    copperHot.emissiveIntensity = 0.07 * heat;
    for (const q of QUANTITIES) {
      const G = groups[q];
      const [w, h, d] = G.dims;
      G.hot.scale.set(w * s, h * s, d * s);
      G.hot.position.set(G.x, q === 'length' ? HOT_Y + ROD_UP.hot : HOT_Y + (h * s) / 2, 0);
      G.burner.set(heat, time);
      G.old.visible = q === chosen && heat > 0.02;
    }
  }

  /** The middle of a body's right side, in the scene (for a label); which = 'cold' | 'hot'. */
  function sidePoint(q, which, out) {
    const G = groups[q];
    const m = G[which];
    return out.set(G.x + m.scale.x / 2, m.position.y, 0);
  }
  /** The middle of the rod's top (a label point). */
  function topPoint(which, out) {
    const m = groups.length[which];
    return out.set(groups.length.x, m.position.y + m.scale.y / 2, 0);
  }

  update(T1, 0, 'length');
  return { root, groups, update, sidePoint, topPoint };
}
