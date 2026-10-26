// The Earth and a body on it (the second half of page 79): the Earth cut open like an orange with a quarter taken out
// towards the viewer, so its centre shows; the cut faces show the layers (inner core, outer core, mantle, a thin crust).
// Dhaka is at the top, north away from the viewer, east to the right. On top sits an iron 1 kg weight (বাটখারা, as
// in a bazaar), drawn very much bigger than life (the Earth is 6370 km across its radius); a second one can stand on
// it (2 kg). The edge where the two cut faces meet runs straight down from the weight to the centre: R, the distance
// from the Earth's centre to the body. Units: the Earth's radius is 1.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { DHAKA, earthTexture } from './maps.js';

export const WEIGHT = { h: 0.15, r0: 0.092, r1: 0.074 }; // in Earth radii (drawn huge)
const LIFT = 0.085; // how far above the ground the weight is held in one test question (drawn huge: "1 m")

/** The layers on a cut face: a radial gradient, centre at the middle of the texture. */
function layersTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const r = S / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  // radii as parts of the Earth's: inner core 0.19, outer core 0.55, mantle to the crust (drawn a little thick)
  grad.addColorStop(0, '#ffe7a0');
  grad.addColorStop(0.17, '#ffd36b');
  grad.addColorStop(0.2, '#f6b04e');
  grad.addColorStop(0.53, '#ee9a45');
  grad.addColorStop(0.56, '#eda066');
  grad.addColorStop(0.9, '#e08a55');
  grad.addColorStop(0.965, '#d67f4f');
  grad.addColorStop(0.97, '#7d5a43');
  grad.addColorStop(1, '#6b4c38');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  // thin boundaries between the layers
  g.strokeStyle = 'rgba(120, 60, 30, 0.35)';
  g.lineWidth = 2;
  for (const k of [0.19, 0.545]) {
    g.beginPath();
    g.arc(r, r, r * k, 0, Math.PI * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A geographic direction (latitude, longitude in degrees) on three's sphere UVs (the map's u = (lon + 180)/360). */
function geoDir(lat, lon) {
  const phi = THREE.MathUtils.degToRad(lon + 180);
  const theta = THREE.MathUtils.degToRad(90 - lat);
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
}

/** An iron bazaar weight: a squat waisted body, a flat top and a ring handle; "১ kg" on a plate at the front. */
function createWeight(materials, label, name) {
  const group = new THREE.Group();
  group.name = name;
  const { h, r0, r1 } = WEIGHT;
  const pts = [
    [0, 0],
    [r0, 0],
    [r0, h * 0.12],
    [r0 * 0.93, h * 0.2],
    [r1 * 0.98, h * 0.55],
    [r1, h * 0.86],
    [r1 * 0.92, h],
    [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), materials.iron);
  body.name = `${name}Body`;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r1 * 0.42, r1 * 0.11, 10, 28), materials.iron);
  ring.position.y = h + r1 * 0.36;
  ring.name = `${name}Handle`;
  const text = textMesh(label, h * 0.26, { color: '#f1f3f5', weight: 700 });
  text.position.set(0, h * 0.5, r1 * 1.02 + 0.002);
  group.add(body, ring, text);
  return group;
}

/**
 * @param {{ renderer: THREE.WebGLRenderer, kg: string }} options  kg: the label on each weight ("১ kg")
 */
export function createEarth({ renderer, kg }) {
  const root = new THREE.Group();
  root.name = 'EarthAndWeight';
  renderer.localClippingEnabled = true;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // the quarter towards the viewer is cut away: points with z > |x| (clipped only where both planes clip)
  const cut = [new THREE.Plane(new THREE.Vector3(1, 0, -1).normalize(), 0), new THREE.Plane(new THREE.Vector3(-1, 0, -1).normalize(), 0)];
  const globeMat = new THREE.MeshStandardMaterial({
    name: 'Earth',
    map: earthTexture(aniso),
    roughness: 0.8,
    metalness: 0,
    clippingPlanes: cut,
    clipIntersection: true,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), globeMat);
  globe.name = 'Earth';
  // Dhaka to the top (+y), north away from the viewer (−z), so east is to the right
  const b = geoDir(DHAKA[1], DHAKA[0]);
  const north = new THREE.Vector3(0, 1, 0);
  const n = north.clone().addScaledVector(b, -north.dot(b)).normalize();
  const c = new THREE.Vector3().crossVectors(b, n);
  const local = new THREE.Matrix4().makeBasis(b, n, c);
  const world = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));
  globe.quaternion.setFromRotationMatrix(world.multiply(local.transpose()));
  root.add(globe);

  // the two cut faces: half discs in the planes z = x (x > 0) and z = −x (x < 0), facing into the cut
  const layerMap = layersTexture();
  const layers = new THREE.MeshStandardMaterial({
    name: 'EarthLayers',
    map: layerMap,
    emissive: 0xffffff,
    emissiveMap: layerMap,
    emissiveIntensity: 0.32,
    roughness: 0.85,
    metalness: 0,
  });
  const right = new THREE.Mesh(new THREE.CircleGeometry(1, 96, -Math.PI / 2, Math.PI), layers);
  right.rotation.y = -Math.PI / 4;
  right.name = 'CutFaceRight';
  const left = new THREE.Mesh(new THREE.CircleGeometry(1, 96, Math.PI / 2, Math.PI), layers);
  left.rotation.y = Math.PI / 4;
  left.name = 'CutFaceLeft';
  root.add(right, left);

  // the centre: a small dark dot where the cut faces meet
  const centre = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 14), new THREE.MeshBasicMaterial({ color: 0x1d2733 }));
  centre.name = 'Centre';
  centre.userData.noExport = true;
  root.add(centre);

  const iron = new THREE.MeshPhysicalMaterial({ name: 'WeightIron', color: 0x4a4f57, metalness: 0.75, roughness: 0.42 });
  const w1 = createWeight({ iron }, kg, 'Weight1');
  const w2 = createWeight({ iron }, kg, 'Weight2');
  w2.visible = false;
  const weights = new THREE.Group();
  weights.name = 'Weights';
  weights.add(w1, w2);
  root.add(weights);

  let placed = 1; // 0: off the Earth (above it, out of the picture), 1: on the ground
  let lift = 0; // 0 … 1: held LIFT above the ground (a test question)
  let count = 1;
  function layout() {
    const ground = 1 + lift * LIFT;
    weights.position.y = ground + (1 - placed) * 1.6;
    w2.position.y = WEIGHT.h; // on the first one's flat top
    w1.children[1].visible = count === 1; // the bottom weight's handle hides under the top one
    w2.visible = count === 2;
  }
  layout();

  const tmp = new THREE.Vector3();
  return {
    root,
    globe,
    weights,
    /** 0 … 1: the weight comes down onto the ground (0: far above, out of the picture). */
    setPlaced(k) {
      placed = k;
      layout();
    },
    /** 0 … 1: the weight held a little above the ground (the test's "1 m"). */
    setLift(k) {
      lift = k;
      layout();
    },
    /** 1 or 2 weights. */
    setCount(k) {
      count = k;
      layout();
    },
    /** The ground under the weight (world). */
    ground: (out = tmp) => out.set(0, 1, 0),
    /** The weights' centre of mass (world). */
    bodyCentre(out = tmp) {
      return out.set(0, weights.position.y + (WEIGHT.h * count) / 2, 0);
    },
    /** The top of the weights (world). */
    bodyTop(out = tmp) {
      return out.set(0, weights.position.y + WEIGHT.h * count + WEIGHT.r1 * 0.6, 0);
    },
    /** The bottom of the weights (world). */
    bodyBottom(out = tmp) {
      return out.set(0, weights.position.y, 0);
    },
  };
}
