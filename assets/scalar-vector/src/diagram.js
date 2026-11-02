// A quiet illustrated map on soft sand: one winding path and one straight vector. One illustrated walker follows the route.
import * as THREE from 'three';
import { JOURNEY, pointAt } from './journey.js';
import { createWalker } from './walker.js';

export const COLORS = { grass: '#e2d5bc', scalar: '#1452a0', vector: '#d84f42', equal: '#18846c', other: '#7351bd', ink: '#203e35' };
export const point3 = ([x, y], height = 0.5) => new THREE.Vector3(x, height, -y);
const paint = (color, options = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...options });

function ribbon(points, width, color, height = 0.15) {
  const positions = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = ((-(b[1] - a[1]) / l) * width) / 2;
    const dy = (((b[0] - a[0]) / l) * width) / 2;
    for (const sign of [-1, 1]) positions.push(points[i][0] + sign * dx, height, -points[i][1] - sign * dy);
  }
  const indices = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, paint(color, { side: THREE.DoubleSide }));
}

function shapeMesh(shape, color, height) {
  const geometry = new THREE.ShapeGeometry(shape, 48);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, paint(color, { side: THREE.DoubleSide }));
  mesh.position.y = height;
  return mesh;
}

function disk(radius, color, height) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 40).rotateX(-Math.PI / 2), paint(color));
  mesh.position.y = height;
  return mesh;
}

function arrow(length, color, shaft = 0.48, head = 1.75, height = 0.55) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -shaft);
  shape.lineTo(length - 2.8, -shaft);
  shape.lineTo(length - 2.8, -head);
  shape.lineTo(length, 0);
  shape.lineTo(length - 2.8, head);
  shape.lineTo(length - 2.8, shaft);
  shape.lineTo(0, shaft);
  shape.closePath();
  return shapeMesh(shape, color, height);
}

function placeArrow(root, tail, length, angle, color) {
  root.traverse((mesh) => {
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  });
  root.clear();
  root.add(arrow(length, '#fff9df', 0.76, 2.1, 0.51), arrow(length, color));
  root.position.copy(point3(tail, 0));
  root.rotation.y = THREE.MathUtils.degToRad(angle);
}

export function createDiagram() {
  const root = new THREE.Group();
  root.name = 'ScalarVectorDiagram';
  const map = new THREE.Group();
  map.name = 'JourneyMap';
  root.add(map);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(62, 58).rotateX(-Math.PI / 2), paint(COLORS.grass));
  map.add(ground);

  // nothing else on the map (no pond or trees): the path, the walker and the arrows are the things to look at
  map.add(ribbon(JOURNEY.points, 2.1, '#c3ad86', 0.1));
  map.add(ribbon(JOURNEY.points, 1.7, '#fff3d8', 0.12));
  for (let d = 0; d < JOURNEY.length - 0.3; d += 2.1)
    map.add(ribbon([pointAt(d / JOURNEY.length), pointAt(Math.min(JOURNEY.length, d + 1.15) / JOURNEY.length)], 0.3, COLORS.scalar, 0.16));
  const trail = ribbon(JOURNEY.points, 0.7, COLORS.scalar, 0.18);
  map.add(trail);
  const position = new THREE.Group();
  position.name = 'PositionVector';
  placeArrow(position, JOURNEY.start, JOURNEY.magnitude, 90, COLORS.vector);
  map.add(position);
  for (const [at, color] of [
    [JOURNEY.start, COLORS.ink],
    [JOURNEY.finish, COLORS.vector],
  ]) {
    const marker = new THREE.Group();
    marker.add(disk(1.05, '#ffffff', 0.6), disk(0.7, color, 0.63));
    marker.position.copy(point3(at, 0));
    map.add(marker);
  }
  const walker = createWalker();
  const traveler = walker.root;
  map.add(traveler);

  const pairs = new THREE.Group();
  pairs.name = 'BookVectors';
  const first = new THREE.Group();
  const second = new THREE.Group();
  pairs.add(first, second);
  root.add(pairs);
  const poses = {
    B: [
      { name: 'A', tail: [-22, -11], length: 25, angle: 45 },
      { name: 'B', tail: [2, -11], length: 25, angle: 45 },
    ],
    C: [
      { name: 'A', tail: [-22, -11], length: 25, angle: 45 },
      { name: 'C', tail: [20, -11], length: 25, angle: 135 },
    ],
    D: [
      { name: 'C', tail: [-2, -11], length: 25, angle: 135 },
      { name: 'D', tail: [20, -11], length: 12.5, angle: 135 },
    ],
  };
  return {
    root,
    map,
    pairs,
    traveler,
    walkerBox: () => walker.box(),
    first,
    second,
    poses,
    setMap(progress, showVector) {
      map.visible = true;
      pairs.visible = false;
      trail.geometry.setDrawRange(0, Math.floor(progress * (JOURNEY.points.length - 1)) * 6);
      traveler.position.copy(point3(pointAt(progress), 1));
      traveler.visible = true;
      walker.set(progress);
      position.visible = showVector > 0;
      position.scale.x = Math.max(0.001, showVector);
    },
    setPair(name) {
      map.visible = false;
      pairs.visible = true;
      const [a, b] = poses[name];
      placeArrow(first, a.tail, a.length, a.angle, COLORS.vector);
      placeArrow(second, b.tail, b.length, b.angle, name === 'B' ? '#23b894' : '#ac82e0');
      return [a, b];
    },
    fitMarker(stage) {
      walker.fit(stage);
    },
  };
}
