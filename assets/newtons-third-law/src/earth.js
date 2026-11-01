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

/** Stars behind the Earth: two sizes of points on a far sphere, a few warm or blue-white (one draw call each). */
function stars(pixelRatio) {
  const group = new THREE.Group();
  group.name = 'Stars';
  group.userData.noExport = true;
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const tints = ['#ffffff', '#dfe9ff', '#fff1d6', '#cfe0ff'].map((c) => new THREE.Color(c));
  for (const [count, size] of [
    [700, 1.4],
    [140, 2.4],
  ]) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // directions behind and around the scene (the camera looks along −z)
      const z = -0.25 - rnd() * 0.75;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      pos.set([Math.cos(a) * r * 60, Math.sin(a) * r * 60, z * 60], i * 3);
      tints[Math.floor(rnd() * tints.length)]
        .clone()
        .multiplyScalar(0.55 + rnd() * 0.45)
        .toArray(col, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ name: 'Stars', size: size * pixelRatio, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }),
    );
    points.frustumCulled = false;
    points.renderOrder = -1;
    group.add(points);
  }
  return group;
}

/** Full Earth and apple, matching the book's diagram. Sizes and separation are deliberately not to scale. */
export function createEarthScene({ renderer }) {
  const root = new THREE.Group();
  root.name = 'AppleAndEarth';
  const earthMaterial = new THREE.MeshStandardMaterial({ name: 'BlueMarbleEarth', color: 0xffffff, roughness: 0.8, metalness: 0 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 48), earthMaterial);
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
    new THREE.SphereGeometry(EARTH_R * 1.026, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x36b8ff, side: THREE.BackSide, transparent: true, opacity: 0.22 }),
  );
  atmosphere.position.copy(earth.position);
  atmosphere.userData.noExport = true;
  root.add(atmosphere);
  root.add(stars(renderer.getPixelRatio()));
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
  const trailEnds = [new THREE.Vector3(-0.4, startY, 0.1), new THREE.Vector3(-0.4, startY, 0.1)];
  trail.geometry.setFromPoints(trailEnds);
  const trailDistance = new THREE.Float32BufferAttribute([0, 0], 1);
  trail.geometry.setAttribute('lineDistance', trailDistance);
  trail.frustumCulled = false;
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
      if (!trail.visible) return;
      trailEnds[1].y = startY - fallen;
      trail.geometry.setFromPoints(trailEnds);
      // the dashes' distances in place (computeLineDistances would make a new GPU buffer every frame)
      trailDistance.setX(1, fallen);
      trailDistance.needsUpdate = true;
    },
    setFall(fallen) {
      apple.root.position.set(0, startY - fallen, 0);
    },
    bounds: new THREE.Box3(new THREE.Vector3(-1.55, -2.22, -0.2), new THREE.Vector3(1.5, 1.9, 1.25)),
  };
}
