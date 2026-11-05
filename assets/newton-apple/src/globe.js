// The Earth from far away: the same tree, drawn far too big, standing on a globe (Earth radius = 1) with the quarter
// toward the viewer cut away down to the centre, so the student sees where R is measured from: the Earth's centre, not
// its surface. A dark sky of stars, the map from ./maps.js, a thin blue rim of air.
import * as THREE from 'three';
import { DHAKA, earthTexture } from './maps.js';

/** A geographic direction on three's sphere UVs (the map's u = (lon + 180)/360). */
function geoDir(lat, lon) {
  const phi = THREE.MathUtils.degToRad(lon + 180);
  const theta = THREE.MathUtils.degToRad(90 - lat);
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
}

function createStars(count = 700) {
  const pos = new Float32Array(count * 3);
  let seed = 41;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const z = rand() * 2 - 1;
    const q = Math.sqrt(1 - z * z);
    pos.set([34 * q * Math.cos(a), 34 * z, 34 * q * Math.sin(a)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(
    g,
    new THREE.PointsMaterial({
      name: 'Stars',
      color: '#dfe7ff',
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  stars.name = 'Stars';
  stars.userData.noExport = true;
  return stars;
}

export const PIN_H = 0.3; // the tree on the globe: the apple hangs at this height above the ground

/** The inside, as plain warm layers from the crust to the core. */
function insideTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#ffe9a8');
  grad.addColorStop(0.16, '#ffd166');
  grad.addColorStop(0.2, '#f7a13c');
  grad.addColorStop(0.52, '#ec6e2c');
  grad.addColorStop(0.56, '#c9502a');
  grad.addColorStop(0.95, '#8f3a24');
  grad.addColorStop(0.97, '#6d5a48');
  grad.addColorStop(1, '#6d5a48');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createGlobe({ renderer }) {
  const root = new THREE.Group();
  root.name = 'EarthFromAfar';
  renderer.localClippingEnabled = true;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  // the quarter toward the viewer is cut away: points with z > |x| (clipped only where both planes clip)
  const cut = [new THREE.Plane(new THREE.Vector3(1, 0, -1).normalize(), 0), new THREE.Plane(new THREE.Vector3(-1, 0, -1).normalize(), 0)];
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 72, 48),
    new THREE.MeshStandardMaterial({
      name: 'Earth',
      map: earthTexture(aniso),
      roughness: 0.8,
      metalness: 0,
      clippingPlanes: cut,
      clipIntersection: true,
    }),
  );
  earth.name = 'Earth';
  // Bangladesh at the top (+y), north away from the viewer, as in the sister figure
  const b = geoDir(DHAKA[1], DHAKA[0]);
  const north = new THREE.Vector3(0, 1, 0);
  const n = north.clone().addScaledVector(b, -north.dot(b)).normalize();
  const c = new THREE.Vector3().crossVectors(b, n);
  const local = new THREE.Matrix4().makeBasis(b, n, c);
  const world = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));
  earth.quaternion.setFromRotationMatrix(world.multiply(local.transpose()));
  root.add(earth);
  const insideMat = new THREE.MeshStandardMaterial({ name: 'Inside', map: insideTexture(), roughness: 0.9, metalness: 0 });
  const right = new THREE.Mesh(new THREE.CircleGeometry(1, 48, -Math.PI / 2, Math.PI), insideMat);
  right.rotation.y = -Math.PI / 4;
  const left = new THREE.Mesh(new THREE.CircleGeometry(1, 48, Math.PI / 2, Math.PI), insideMat);
  left.rotation.y = Math.PI / 4;
  left.name = 'CutFaceLeft';
  right.name = 'CutFaceRight';
  root.add(left, right);

  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(1.035, 48, 32),
    new THREE.MeshBasicMaterial({ name: 'Air', color: '#7cb7ff', transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }),
  );
  rim.userData.noExport = true;
  root.add(rim);

  // the tree, far bigger than life, and the apple on it
  const pin = new THREE.Group();
  pin.name = 'TreeDrawnBig';
  const wood = new THREE.MeshStandardMaterial({ name: 'PinWood', color: '#5d4a3a', roughness: 0.9 });
  const leaf = new THREE.MeshStandardMaterial({ name: 'PinLeaves', color: '#3f7030', roughness: 0.9, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.26, 8).translate(0, 0.13, 0), wood);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 2), leaf);
  crown.position.y = 0.33;
  crown.scale.set(1.1, 0.9, 1.1);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 2), leaf);
  crown2.position.set(-0.11, 0.27, 0.02);
  const apple = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 16, 12),
    new THREE.MeshStandardMaterial({ name: 'PinApple', color: '#c81e1e', roughness: 0.4 }),
  );
  apple.position.set(0.16, PIN_H - 0.09, 0);
  pin.add(trunk, crown, crown2, apple);
  pin.position.set(-0.16, 0.985, 0); // so the apple hangs right over the Earth's centre
  root.add(pin);

  const stars = createStars();
  root.add(stars);
  return { root, earth, pin, apple };
}
