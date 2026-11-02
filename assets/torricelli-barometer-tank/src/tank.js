// The tank with a hole (the owner's third picture, blended in for air pressure): a glass tank of water on the bench
// with a screw lid and one hole near the bottom of its right wall, plugged with a red rubber cork. With the lid on,
// the cork pulled, a few drops come out and stop (nothing presses on the water from above; the air outside presses
// on the hole); with the lid off, the air presses on the water's surface too and a jet spurts out, the stronger the
// deeper the hole is under the surface. The water is a box scaled to its height (never rebuilt); the jet is a thin
// tube along its arc, rebuilt only when its reach changes. Metres; the bench top is y = 0.
import * as THREE from 'three';
import { TANK } from './reading.js';

export const BOX = { w: 0.18, d: 0.13, h: 0.31, wall: 0.005 };
/** The hole (world): on the outside of the right wall. */
export const HOLE = new THREE.Vector3(BOX.w / 2, TANK.floor + TANK.hole, 0);

export function createTank(mats) {
  const root = new THREE.Group();
  root.name = 'Tank';
  const { w, d, h, wall } = BOX;

  // the glass: four walls and a floor (thin boxes) with brighter edges
  const glass = mats.glass.clone();
  glass.opacity = 0.18;
  const parts = [
    [w, TANK.floor, d, 0, TANK.floor / 2, 0],
    [wall, h, d, -w / 2 + wall / 2, h / 2, 0],
    [wall, h, d, w / 2 - wall / 2, h / 2, 0],
    [w, h, wall, 0, h / 2, -d / 2 + wall / 2],
    [w, h, wall, 0, h / 2, d / 2 - wall / 2],
  ];
  for (const [sx, sy, sz, x, y, z] of parts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), glass);
    m.position.set(x, y, z);
    m.renderOrder = 8;
    root.add(m);
  }
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    new THREE.LineBasicMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.8 }),
  );
  edges.position.y = h / 2;
  edges.renderOrder = 9;
  root.add(edges);

  // the water: a box from the floor up, scaled to its height
  const waterMat = new THREE.MeshPhysicalMaterial({
    name: 'Water',
    color: '#2a86e0',
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    depthWrite: false,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(w - wall * 2 - 0.001, 1, d - wall * 2 - 0.001).translate(0, 0.5, 0), waterMat);
  water.position.y = TANK.floor;
  water.name = 'WaterInTank';
  water.renderOrder = 5;
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(w - wall * 2 - 0.001, d - wall * 2 - 0.001),
    new THREE.MeshPhysicalMaterial({ color: '#8fd0ff', roughness: 0.02, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.renderOrder = 6;
  root.add(water, surface);

  // the lid: a blue plastic plate with a knob, sitting on the rim
  const lid = new THREE.Group();
  lid.name = 'Lid';
  const lidMat = new THREE.MeshStandardMaterial({ name: 'LidPlastic', color: '#1f6fc2', roughness: 0.35 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.014, 0.012, d + 0.014), lidMat);
  plate.castShadow = true;
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.018, 20),
    new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.35 }),
  );
  knob.position.y = 0.015;
  knob.castShadow = true;
  lid.add(plate, knob);
  lid.position.y = h + 0.006;
  root.add(lid);

  // the cork in the hole (pulled out along +x when opened)
  const cork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0068, 0.0056, 0.02, 18),
    new THREE.MeshStandardMaterial({ name: 'Cork', color: '#c8322b', roughness: 0.6 }),
  );
  cork.rotation.z = -Math.PI / 2;
  cork.position.copy(HOLE).add(new THREE.Vector3(0.004, 0, 0));
  cork.castShadow = true;
  const holeRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.0042, 0.0012, 8, 18),
    new THREE.MeshStandardMaterial({ color: '#7f97a8', roughness: 0.3 }),
  );
  holeRim.rotation.y = Math.PI / 2;
  holeRim.position.copy(HOLE).add(new THREE.Vector3(0.0003, 0, 0));
  root.add(cork, holeRim);

  // the jet and the puddle it makes on the bench
  const jetMat = new THREE.MeshPhysicalMaterial({
    name: 'Jet',
    color: '#2d8ff0',
    roughness: 0.05,
    transparent: true,
    opacity: 0.92,
    clearcoat: 1,
    emissive: '#0d5cb8',
    emissiveIntensity: 0.55,
  });
  const jet = new THREE.Mesh(new THREE.BufferGeometry(), jetMat);
  jet.name = 'Jet';
  jet.visible = false;
  jet.renderOrder = 7;
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshPhysicalMaterial({ color: '#6bb8f0', roughness: 0.03, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.0008;
  puddle.scale.setScalar(1e-4);
  puddle.renderOrder = 4;
  root.add(jet, puddle);

  let jetKey = '';
  const fall = HOLE.y;
  /**
   * The jet: `reach` (m from the wall to where it lands), `thick` (its radius, m); 0 hides it. It leaves the hole
   * level and falls on a parabola to the bench.
   */
  function setJet(reach, thick = 0.0032) {
    const on = reach > 0.002 && thick > 0.0002;
    jet.visible = on;
    if (!on) return;
    const key = `${reach.toFixed(4)}|${thick.toFixed(5)}`;
    if (key === jetKey) return;
    jetKey = key;
    const pts = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push(new THREE.Vector3(HOLE.x + 0.004 + reach * u, fall - fall * u * u, 0));
    }
    jet.geometry.dispose();
    jet.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, thick, 8, false);
  }

  /** The water's height above the tank's floor (m). */
  function setWater(level) {
    water.scale.y = Math.max(0.001, level);
    surface.position.y = TANK.floor + level + 0.0004;
  }
  setWater(TANK.water);

  return {
    root,
    lid,
    cork,
    jet,
    puddle,
    setJet,
    setWater,
    /** Where the jet lands (world x) for a reach. */
    landing: (reach) => HOLE.x + 0.004 + reach,
    hitMeshes: [lid.children[0], knob, cork],
  };
}
