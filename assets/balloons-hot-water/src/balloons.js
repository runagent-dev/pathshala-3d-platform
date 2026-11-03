// The 3D of the "নিজে করো" on page 175, in centimetres: a glass tank of water on the bench with two balloons under the
// surface, each tied by a thin string to a small weight on the tank's floor so they stay under the water: the rose
// one is filled with air, the blue one with water (same volume, 1 L, to start). set(T) sets the water's temperature
// (its tint) and sizes both balloons from their volume ratios; only the radius is exaggerated (said in the panel).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { T0, drawnRatio, airRatio, waterRatio } from './reading.js';

export const G = {
  W: 40, // the tank's width (x)
  D: 18, // its depth (z)
  H: 24, // its height
  LEVEL: 21.5, // the water's surface
  R0: 6.2, // the balloons' radius at the start: 4/3 π r³ = 1 L
  CY: 11.8, // the balloons' centre height
  X: 9.8, // each balloon's centre is ±X from the middle
};

const COLD = new THREE.Color('#a9d6f0');
const HOT = new THREE.Color('#f4b58a');

export function createBalloons() {
  const root = new THREE.Group();
  root.name = 'BalloonsInHotWater';
  const T = G.W / 2;
  const Z = G.D / 2;

  // the tank: five thin glass faces and its twelve edges in steel
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'Glass',
    color: '#c2e4e0',
    roughness: 0.05,
    transparent: true,
    opacity: 0.17,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const face = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const glass = new THREE.Mesh(
    mergeGeometries([
      face(G.W, 0.3, G.D, 0, 0.15, 0), // floor
      face(G.W, G.H, 0.3, 0, G.H / 2, -Z), // back
      face(G.W, G.H, 0.3, 0, G.H / 2, Z), // front
      face(0.3, G.H, G.D, -T, G.H / 2, 0),
      face(0.3, G.H, G.D, T, G.H / 2, 0),
    ]),
    glassMat,
  );
  glass.name = 'Tank';
  glass.renderOrder = 6;
  const steel = new THREE.MeshStandardMaterial({ name: 'Frame', color: '#5b6874', metalness: 0.6, roughness: 0.4 });
  const edge = (a, b) => {
    const g = new THREE.BoxGeometry(Math.abs(b.x - a.x) || 0.5, Math.abs(b.y - a.y) || 0.5, Math.abs(b.z - a.z) || 0.5);
    return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const edges = [];
  for (const y of [0, G.H]) {
    edges.push(edge(V(-T, y, -Z), V(T, y, -Z)), edge(V(-T, y, Z), V(T, y, Z)), edge(V(-T, y, -Z), V(-T, y, Z)), edge(V(T, y, -Z), V(T, y, Z)));
  }
  for (const x of [-T, T]) for (const z of [-Z, Z]) edges.push(edge(V(x, 0, z), V(x, G.H, z)));
  const frame = new THREE.Mesh(mergeGeometries(edges), steel);
  frame.name = 'TankFrame';
  frame.castShadow = true;
  const waterMat = new THREE.MeshStandardMaterial({
    name: 'Water',
    color: COLD,
    roughness: 0.15,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(G.W - 0.6, G.LEVEL, G.D - 0.6).translate(0, G.LEVEL / 2 + 0.3, 0), waterMat);
  water.name = 'Water';
  water.renderOrder = 4;
  // the water's surface: a brighter sheet with a thin meniscus line where it meets the glass
  const surfaceMat = new THREE.MeshStandardMaterial({
    name: 'WaterSurface',
    color: '#e6f4fb',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(G.W - 0.6, G.D - 0.6).rotateX(-Math.PI / 2).translate(0, G.LEVEL + 0.3, 0), surfaceMat);
  surface.name = 'WaterSurface';
  surface.renderOrder = 5;
  const lineMat = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0.8 });
  const ly = G.LEVEL + 0.32;
  const meniscus = new THREE.Mesh(
    mergeGeometries([
      new THREE.BoxGeometry(G.W - 0.5, 0.18, 0.16).translate(0, ly, Z - 0.3),
      new THREE.BoxGeometry(G.W - 0.5, 0.18, 0.16).translate(0, ly, -Z + 0.3),
      new THREE.BoxGeometry(0.16, 0.18, G.D - 0.5).translate(-T + 0.3, ly, 0),
      new THREE.BoxGeometry(0.16, 0.18, G.D - 0.5).translate(T - 0.3, ly, 0),
    ]),
    lineMat,
  );
  meniscus.name = 'Meniscus';
  meniscus.renderOrder = 6;
  root.add(water, surface, meniscus, glass, frame);

  // a balloon: a sphere, a small knot under it and a string down to a weight
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  const knotGeo = new THREE.ConeGeometry(0.55, 1.3, 14).translate(0, -0.65, 0);
  const lipGeo = new THREE.TorusGeometry(0.5, 0.2, 8, 16).rotateX(Math.PI / 2);
  const stringGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 6).translate(0, -0.5, 0);
  const weightGeo = new THREE.CylinderGeometry(1.1, 1.4, 0.9, 16).translate(0, 0.75, 0);
  const stringMat = new THREE.MeshStandardMaterial({ color: '#2d3640', roughness: 0.7 });
  const weightMat = new THREE.MeshStandardMaterial({ name: 'Weight', color: '#454c54', metalness: 0.5, roughness: 0.5 });
  function balloon(name, x, color, opacity, ratioOf) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, G.CY, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      name: `${name}Rubber`,
      color,
      roughness: 0.28,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
    });
    const body = new THREE.Mesh(sphere, mat);
    body.name = `${name}Body`;
    body.scale.set(1, 1.08, 1); // a balloon is a little taller than wide
    const knot = new THREE.Mesh(knotGeo, mat);
    const lip = new THREE.Mesh(lipGeo, mat); // the rolled rim of the balloon's neck, where the string is tied
    const str = new THREE.Mesh(stringGeo, stringMat);
    g.add(body, knot, lip, str);
    const weight = new THREE.Mesh(weightGeo, weightMat);
    weight.position.set(x, 0.3, 0);
    weight.castShadow = true;
    root.add(g, weight);
    const out = {
      root: g,
      body,
      r: G.R0,
      /** The point on the balloon's top, for a label. */
      top: new THREE.Vector3(x, G.CY + G.R0 * 1.08, 0),
      set(T) {
        const r = G.R0 * drawnRatio(ratioOf(T));
        out.r = r;
        body.scale.set(r, r * 1.08, r);
        knot.position.y = -r * 1.08 * 0.96;
        lip.position.y = knot.position.y - 1.25;
        str.position.y = knot.position.y - 1.3;
        str.scale.y = Math.max(0.1, G.CY + str.position.y - 1.2);
        out.top.set(x, G.CY + r * 1.08, 0);
      },
    };
    return out;
  }
  const air = balloon('AirBalloon', -G.X, '#e03168', 0.94, airRatio);
  const wat = balloon('WaterBalloon', G.X, '#2a86e6', 0.9, waterRatio);

  return {
    root,
    air,
    water: wat,
    tank: glass,
    /** The water's temperature in °C: its tint, and both balloons' sizes. */
    set(Tw) {
      waterMat.color.lerpColors(COLD, HOT, THREE.MathUtils.clamp((Tw - T0) / 60, 0, 1));
      air.set(Tw);
      wat.set(Tw);
    },
    dispose() {
      root.traverse((o) => o.geometry?.dispose());
    },
  };
}
