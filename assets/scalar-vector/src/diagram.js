// A quiet illustrated map: one winding path, one straight vector, a pond and a few trees. No school, actors or rings.
import * as THREE from 'three';
import { JOURNEY, pointAt } from './journey.js';

export const COLORS = { grass: '#35a06c', scalar: '#1452a0', vector: '#d84f42', equal: '#18846c', other: '#7351bd', ink: '#203e35' };
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

function tree(x, y, size) {
  const group = new THREE.Group();
  const shade = disk(2.1, '#4b9264', 0.02);
  shade.scale.set(1, 1, 0.55);
  shade.position.z = 0.8;
  group.add(shade);
  const shape = new THREE.Shape();
  const outline = [
    [0, 3.1],
    [-0.9, 1.5],
    [-0.5, 1.5],
    [-1.5, 0],
    [-0.9, 0],
    [-2, -1.6],
    [2, -1.6],
    [0.9, 0],
    [1.5, 0],
    [0.5, 1.5],
    [0.9, 1.5],
  ];
  outline.forEach(([px, py], i) => (i ? shape.lineTo(px, py) : shape.moveTo(px, py)));
  shape.closePath();
  group.add(shapeMesh(shape, '#145f48', 0.11));
  const inside = shapeMesh(shape, '#249d60', 0.13);
  inside.scale.set(0.79, 1, 0.79);
  group.add(inside);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 1.2), paint('#7e5737'));
  trunk.position.set(0, 0.1, 1.8);
  group.add(trunk);
  group.position.copy(point3([x, y], 0));
  group.scale.setScalar(size);
  return group;
}

export function createDiagram() {
  const root = new THREE.Group();
  root.name = 'ScalarVectorDiagram';
  const map = new THREE.Group();
  map.name = 'JourneyMap';
  root.add(map);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(62, 58).rotateX(-Math.PI / 2), paint(COLORS.grass));
  map.add(ground);

  const pond = new THREE.Shape();
  pond.moveTo(-4.9, -1);
  pond.bezierCurveTo(-5.7, 3, -1, 5.8, 2.5, 3.9);
  pond.bezierCurveTo(6.3, 1.6, 5.6, -3.9, 2, -4.9);
  pond.bezierCurveTo(-1, -6.2, -4, -4.2, -4.9, -1);
  const bank = shapeMesh(pond, '#238c77', 0.03);
  bank.position.add(point3([7, -5], 0));
  bank.scale.set(1.12, 1, 1.12);
  const water = shapeMesh(pond, '#22bbdf', 0.06);
  water.position.add(point3([7, -5], 0));
  map.add(bank, water);
  for (const [x, y, size] of [
    [-7, 0, 1],
    [-2, 10, 0.9],
    [12, 3, 0.8],
  ])
    map.add(tree(x, y, size));

  map.add(ribbon(JOURNEY.points, 2.1, '#89ad79', 0.1));
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
  const traveler = new THREE.Group();
  traveler.name = 'WalkerMarker';
  traveler.add(disk(1.13, '#ffffff', 0.7), disk(0.91, '#e6aa2e', 0.73), disk(0.26, COLORS.ink, 0.76));
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
    first,
    second,
    poses,
    setMap(progress, showVector) {
      map.visible = true;
      pairs.visible = false;
      trail.geometry.setDrawRange(0, Math.floor(progress * (JOURNEY.points.length - 1)) * 6);
      traveler.position.copy(point3(pointAt(progress), 0));
      traveler.visible = progress < 1;
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
      const p = traveler.position.clone().project(stage.camera);
      const q = traveler.position
        .clone()
        .add(new THREE.Vector3(1, 0, 0))
        .project(stage.camera);
      const px = (Math.abs(p.x - q.x) * stage.width) / 2;
      traveler.scale.setScalar((stage.height < 240 ? 11 : 16) / Math.max(1, px));
    },
  };
}
