// Whole Earth and apple: a slowed fall, a ghost start position and a distance trail.
// Scene units are metres, but object sizes and separation are deliberately not to scale.
import * as THREE from 'three';

export const EARTH_R = 1.05; // m: the drawn Earth (not to scale)
export const APPLE_R = 0.3; // m: the drawn apple's radius

const mat = (name, color, roughness = 0.8) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });

/** An apple of radius r: a slightly squat round body with a dimple, a stem and one leaf; its centre at the origin. */
function createApple(r) {
  const root = new THREE.Group();
  root.name = 'Apple';
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    const rr = Math.sin(a) * (1 + 0.06 * Math.sin(a * 2)) * r;
    const y = -Math.cos(a) * r * 0.92 - (i > 20 ? (i - 20) * 0.05 * r : 0) + (i < 3 ? (3 - i) * 0.04 * r : 0);
    pts.push(new THREE.Vector2(Math.max(0.0001, rr), y));
  }
  const skin = new THREE.MeshPhysicalMaterial({ name: 'Apple', color: '#e92d24', roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), skin);
  body.name = 'AppleBody';
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.05, r * 0.07, r * 0.42, 6), mat('AppleStem', '#5a3d23', 0.9));
  stem.position.set(r * 0.03, r * 0.95, 0);
  stem.rotation.z = -0.25;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(r * 0.28, r * 0.2, r * 0.6, 0);
  leafShape.quadraticCurveTo(r * 0.28, -r * 0.18, 0, 0);
  const leafMat = mat('AppleLeaf', '#58a52c', 0.6);
  leafMat.side = THREE.DoubleSide;
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 6), leafMat);
  leaf.position.set(r * 0.08, r * 1.02, 0);
  leaf.rotation.set(0.3, 0.4, 0.35);
  root.add(body, stem, leaf);
  return { root, body };
}

/** Full Earth and apple, matching the book's diagram. Sizes and separation are deliberately not to scale. */
export function createEarthScene({ renderer }) {
  const root = new THREE.Group();
  root.name = 'AppleAndEarth';
  const earthMaterial = new THREE.MeshStandardMaterial({ name: 'BlueMarbleEarth', color: 0xffffff, roughness: 0.8, metalness: 0 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 64), earthMaterial);
  earth.name = 'Earth';
  earth.position.y = -EARTH_R;
  earth.rotation.y = 2.3;
  root.add(earth);
  const ready = new THREE.TextureLoader().loadAsync(new URL('../media/earth-blue-marble.png', import.meta.url).href).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    earthMaterial.map = texture;
    earthMaterial.needsUpdate = true;
  });
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.026, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x36b8ff, side: THREE.BackSide, transparent: true, opacity: 0.22 }),
  );
  atmosphere.position.copy(earth.position);
  atmosphere.userData.noExport = true;
  root.add(atmosphere);
  const apple = createApple(APPLE_R);
  apple.root.name = 'Apple';
  root.add(apple.root);
  const startY = 1.45;
  const ghost = createApple(APPLE_R).root;
  ghost.name = 'AppleStart';
  ghost.userData.noExport = true;
  ghost.position.y = startY;
  ghost.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.material = new THREE.MeshBasicMaterial({ color: '#e4f5ff', wireframe: true, transparent: true, opacity: 0.24, depthWrite: false });
    }
  });
  root.add(ghost);
  const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#d7efff', dashSize: 0.055, gapSize: 0.04 }));
  trail.name = 'FallTrail';
  trail.userData.noExport = true;
  root.add(trail);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  apple.root.add(hit);
  return {
    root,
    earth,
    apple: apple.root,
    hit,
    ready,
    startY,
    showTrail(show, fallen) {
      ghost.visible = show && fallen > APPLE_R * 2.1;
      trail.visible = show && fallen > 0.02;
      trail.geometry.setFromPoints([new THREE.Vector3(-0.4, startY, 0.1), new THREE.Vector3(-0.4, startY - fallen, 0.1)]);
      trail.computeLineDistances();
    },
    setFall(fallen) {
      apple.root.position.set(0, startY - fallen, 0);
    },
    bounds: new THREE.Box3(new THREE.Vector3(-1.55, -2.22, -0.2), new THREE.Vector3(1.5, 1.9, 1.25)),
  };
}
