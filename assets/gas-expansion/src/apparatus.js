// The 3D of the book's চিত্র ৬.০৭, in centimetres: two glass cylinders side by side, each with a striped piston and a
// grey weight (a trapezoid with a ring on top) on it, on a lab tripod. The left one is the gas before (T₁), the right
// one is heated by the burner under it (T₂). The gas is a pale tint with the same 36 molecules in both: when the gas
// expands they spread out, so "the same gas, more room" can be seen. Merged meshes, shared materials, no per-frame
// allocation: the figure calls side.set(T) only when the temperature changes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const G = {
  R_IN: 7.0, // inner radius of the glass cylinder
  R_OUT: 7.45,
  BASE_Y: 11, // bottom of each cylinder (the tripod's ring is just under it)
  BASE_T: 0.9, // the steel base
  H_IN: 16.5, // inner height of the tube
  PT: 1.7, // the piston's thickness
  WH: 3.4, // the weight's height
  GAP_X: 12.5, // each cylinder's centre is ±GAP_X from the middle
  CM_PER_K: 0.027, // the gas column's height per kelvin (500 K: 13.5 cm)
};
export const gasHeight = (T) => T * G.CM_PER_K;
export const GAS_BOTTOM = G.BASE_Y + G.BASE_T;
const MOLECULES = 36;

const UP = new THREE.Vector3(0, 1, 0);

/** A thin cylinder from a to b. */
function rod(a, b, r, seg = 8) {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), seg);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
  return g;
}

/** A small repeatable generator, so the molecules are in the same places in every run. */
function mulberry(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The molecules' places inside the gas, as fractions: x, z on the disc (0 … 1 of the usable radius), y 0 … 1. */
function molecules() {
  const rnd = mulberry(7);
  const list = [];
  // a jittered grid of 6 layers × 6, so they never clump and always show on the glass
  for (let i = 0; i < MOLECULES; i++) {
    const layer = Math.floor(i / 6);
    const a = ((i % 6) / 6 + rnd() * 0.12 + layer * 0.07) * Math.PI * 2;
    const r = Math.sqrt(0.12 + rnd() * 0.88);
    list.push({ x: Math.cos(a) * r, z: Math.sin(a) * r * 0.7, y: (layer + 0.15 + rnd() * 0.7) / 6 });
  }
  return list;
}

function stripedTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e4e7ea';
  ctx.fillRect(0, 0, 128, 8);
  // the book's piston: light with darker vertical bands
  ctx.fillStyle = '#868e96';
  for (const x of [4, 28, 52, 76, 100]) ctx.fillRect(x, 0, 14, 8);
  ctx.fillStyle = '#b6bcc2';
  for (const x of [19, 43, 67, 91, 115]) ctx.fillRect(x, 0, 4, 8);
  ctx.fillStyle = '#f4f5f6';
  for (const x of [23, 47, 71, 95, 119]) ctx.fillRect(x, 0, 5, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 2.2; // about a dozen bands round the piston, as the book's picture
  tex.anisotropy = 4;
  return tex;
}

const COLD = new THREE.Color('#8cc8f2');
const HOT = new THREE.Color('#f7944a');

export function createRig({ renderOrder = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'GasExpansion';

  const steel = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#7d858d', metalness: 0.75, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ name: 'DarkSteel', color: '#3b4046', metalness: 0.6, roughness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'Glass',
    color: '#bfe0ee',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pistonMat = new THREE.MeshStandardMaterial({ name: 'Piston', map: stripedTexture(), metalness: 0.35, roughness: 0.42 });
  const weightMat = new THREE.MeshStandardMaterial({ name: 'Weight', color: '#565b63', metalness: 0.5, roughness: 0.5 });
  const moleculeMat = new THREE.MeshStandardMaterial({ name: 'Molecule', color: '#17407f', roughness: 0.35, transparent: true });

  // shared geometries
  const tubeGeo = (() => {
    const y0 = G.BASE_Y + G.BASE_T;
    const pts = [
      new THREE.Vector2(G.R_IN, y0),
      new THREE.Vector2(G.R_IN, y0 + G.H_IN),
      new THREE.Vector2(G.R_OUT, y0 + G.H_IN),
      new THREE.Vector2(G.R_OUT, G.BASE_Y),
    ];
    return new THREE.LatheGeometry(pts, 40);
  })();
  const rimGeo = new THREE.TorusGeometry((G.R_IN + G.R_OUT) / 2, 0.24, 8, 40).rotateX(Math.PI / 2).translate(0, G.BASE_Y + G.BASE_T + G.H_IN, 0);
  const baseGeo = mergeGeometries([
    new THREE.CylinderGeometry(G.R_OUT + 0.15, G.R_OUT + 0.15, G.BASE_T, 40).translate(0, G.BASE_Y + G.BASE_T / 2, 0),
    new THREE.CylinderGeometry(G.R_OUT + 0.35, G.R_OUT + 0.35, 0.28, 40).translate(0, G.BASE_Y + 0.14, 0),
  ]);
  const gasGeo = new THREE.CylinderGeometry(G.R_IN - 0.04, G.R_IN - 0.04, 1, 40, 1, false).translate(0, 0.5, 0);
  const pistonGeo = mergeGeometries([new THREE.CylinderGeometry(G.R_IN - 0.06, G.R_IN - 0.06, G.PT, 40).translate(0, G.PT / 2, 0)]);
  const sealGeo = mergeGeometries([
    new THREE.TorusGeometry(G.R_IN - 0.06, 0.17, 8, 40).rotateX(Math.PI / 2).translate(0, 0.28, 0),
    new THREE.TorusGeometry(G.R_IN - 0.06, 0.17, 8, 40).rotateX(Math.PI / 2).translate(0, G.PT - 0.28, 0),
  ]);
  const weightGeo = mergeGeometries([
    new THREE.CylinderGeometry(2.3, 4.0, G.WH, 28).translate(0, G.PT + G.WH / 2, 0),
    new THREE.TorusGeometry(0.78, 0.2, 8, 20).translate(0, G.PT + G.WH + 0.62, 0),
  ]);
  // the litre scale on the glass: a short tick every half litre (V = nRT/P, 1 L = 2.7 cm), a long one every litre
  const scaleGeo = (() => {
    const parts = [];
    const a = -0.62; // a little left of the front
    for (let i = 1; i <= 11; i++) {
      const major = i % 2 === 0;
      const len = major ? 2.0 : 1.1;
      const b = new THREE.BoxGeometry(len, 0.12, 0.1);
      // x runs along the tick, so it lies on the glass's front like a ruler's mark
      b.translate(-len / 2, 0, 0);
      b.rotateY(a);
      b.translate(Math.sin(a) * (G.R_OUT + 0.04), GAS_BOTTOM + i * 1.35, Math.cos(a) * (G.R_OUT + 0.04));
      parts.push(b);
    }
    const m = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    return m;
  })();
  const moleculeGeo = new THREE.SphereGeometry(0.55, 12, 9);
  const places = molecules();
  const dummy = new THREE.Object3D();

  /** One cylinder with its gas, piston and weight. set(T) moves them. */
  function makeSide(name, x) {
    const g = new THREE.Group();
    g.name = name;
    g.position.x = x;
    const gasMat = new THREE.MeshStandardMaterial({
      name: `${name}Gas`,
      color: COLD,
      roughness: 0.9,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const gas = new THREE.Mesh(gasGeo, gasMat);
    gas.position.y = GAS_BOTTOM;
    gas.renderOrder = renderOrder;
    const mol = new THREE.InstancedMesh(moleculeGeo, moleculeMat, MOLECULES);
    mol.name = `${name}Molecules`;
    mol.renderOrder = renderOrder + 1;
    const tube = new THREE.Mesh(tubeGeo, glassMat);
    tube.name = `${name}Glass`;
    tube.renderOrder = renderOrder + 3;
    const rim = new THREE.Mesh(rimGeo, dark);
    const scale = new THREE.Mesh(scaleGeo, dark);
    scale.name = `${name}Scale`;
    const base = new THREE.Mesh(baseGeo, steel);
    base.name = `${name}Base`;
    const piston = new THREE.Group();
    piston.name = `${name}Piston`;
    const body = new THREE.Mesh(pistonGeo, pistonMat);
    const seals = new THREE.Mesh(sealGeo, dark);
    const weight = new THREE.Mesh(weightGeo, weightMat);
    weight.name = `${name}Weight`;
    piston.add(body, seals, weight);
    g.add(base, gas, mol, piston, tube, rim, scale);
    for (const m of [body, seals, weight, base, rim]) m.castShadow = true;
    let lastT = null;
    const out = {
      root: g,
      weight,
      piston,
      gas,
      /** The point on top of the weight (world), for a label above it. */
      top: new THREE.Vector3(x, 0, 0),
      T: 0,
      set(T) {
        if (T === lastT) return;
        lastT = T;
        out.T = T;
        const h = gasHeight(T);
        gas.scale.y = h;
        gasMat.color.lerpColors(COLD, HOT, THREE.MathUtils.clamp((T - 200) / 250, 0, 1));
        piston.position.y = GAS_BOTTOM + h;
        out.top.set(x, GAS_BOTTOM + h + G.PT + G.WH + 1.5, 0);
        const rr = G.R_IN - 0.9;
        const free = Math.max(0, h - 1.4);
        for (let i = 0; i < MOLECULES; i++) {
          const p = places[i];
          dummy.position.set(p.x * rr, GAS_BOTTOM + 0.7 + p.y * free, p.z * rr);
          dummy.updateMatrix();
          mol.setMatrixAt(i, dummy.matrix);
        }
        mol.instanceMatrix.needsUpdate = true;
      },
    };
    return out;
  }
  const left = makeSide('Before', -G.GAP_X);
  const right = makeSide('Heated', G.GAP_X);
  root.add(left.root, right.root);

  // a lab tripod under each (the flame goes up through the right one's ring); one merged mesh
  const tripod = (() => {
    const parts = [];
    const ringY = G.BASE_Y - 0.4;
    const ringR = G.R_OUT - 0.05;
    parts.push(new THREE.TorusGeometry(ringR, 0.38, 8, 40).rotateX(Math.PI / 2).translate(0, ringY, 0));
    for (const deg of [30, 150, 270]) {
      const a = (deg * Math.PI) / 180;
      parts.push(
        rod(
          new THREE.Vector3(Math.cos(a) * ringR, ringY, Math.sin(a) * ringR),
          new THREE.Vector3(Math.cos(a) * 10.6, 0.15, Math.sin(a) * 10.6),
          0.38,
        ),
      );
      parts.push(new THREE.SphereGeometry(0.38, 8, 6).translate(Math.cos(a) * ringR, ringY, Math.sin(a) * ringR));
    }
    const merged = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    return merged;
  })();
  for (const x of [-G.GAP_X, G.GAP_X]) {
    const m = new THREE.Mesh(tripod, dark);
    m.name = 'Tripod';
    m.position.x = x;
    m.castShadow = true;
    root.add(m);
  }

  // the burner under the right cylinder: a slim blue stand and a flame that touches the cylinder's base
  const burner = new THREE.Group();
  burner.name = 'Burner';
  burner.position.x = G.GAP_X;
  const burnerMat = new THREE.MeshStandardMaterial({ name: 'Burner', color: '#4d7fb4', metalness: 0.45, roughness: 0.4 });
  const stand = new THREE.Mesh(
    mergeGeometries([
      new THREE.CylinderGeometry(0.7, 0.7, 4.0, 16).translate(0, 2.0, 0),
      new THREE.CylinderGeometry(2.7, 3.0, 0.55, 20).translate(0, 0.27, 0),
      new THREE.CylinderGeometry(1.0, 0.7, 1.0, 16).translate(0, 4.4, 0),
    ]),
    burnerMat,
  );
  stand.name = 'BurnerStand';
  stand.castShadow = true;
  burner.add(stand);
  const flame = new THREE.Group();
  flame.name = 'Flame';
  flame.userData.noExport = true;
  const teardrop = (s) => {
    const pts = [
      [0, 0],
      [0.5, 0.1],
      [0.82, 0.45],
      [0.86, 0.95],
      [0.62, 1.6],
      [0.3, 2.3],
      [0.08, 2.8],
      [0, 3.05],
    ].map(([r, y]) => new THREE.Vector2(r * s, y * s));
    return new THREE.LatheGeometry(pts, 14);
  };
  const outer = new THREE.Mesh(
    teardrop(1),
    new THREE.MeshBasicMaterial({ color: '#ff8a1f', transparent: true, opacity: 0.94, toneMapped: false, side: THREE.DoubleSide }),
  );
  const inner = new THREE.Mesh(teardrop(0.55), new THREE.MeshBasicMaterial({ color: '#ffe36b', toneMapped: false, side: THREE.DoubleSide }));
  const core = new THREE.Mesh(teardrop(0.24), new THREE.MeshBasicMaterial({ color: '#8fc8ff', toneMapped: false, side: THREE.DoubleSide }));
  inner.position.y = 0.1;
  core.position.y = 0.05;
  flame.add(outer, inner, core);
  flame.position.y = 4.85;
  flame.visible = false;
  burner.add(flame);
  root.add(burner);

  const flameBase = 4.85;
  return {
    root,
    left,
    right,
    burner,
    stand,
    flame,
    /** The flame's size: 0 hides it, 1 touches the cylinder's base. */
    setFlame(k, flicker = 0) {
      flame.visible = k > 0.01;
      const s = k * (1 + flicker);
      flame.scale.set(1.2 * (0.9 + 0.1 * k), Math.max(0.01, s * 1.7), 1.2 * (0.9 + 0.1 * k));
      flame.position.y = flameBase;
    },
    dispose() {
      root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    },
  };
}
