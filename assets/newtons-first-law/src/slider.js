// A flat-contact demonstration slider, not a wheeled vehicle. Metres; origin at its front edge.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BOOK as SIZE } from './motion.js';

export function createSlider() {
  const root = new THREE.Group();
  root.name = 'LabSlider';
  const body = new THREE.Group();
  body.name = 'SliderBody';
  body.position.x = -SIZE.length / 2;
  root.add(body);
  const paint = new THREE.MeshPhysicalMaterial({ name: 'RedSlider', color: '#f04420', roughness: 0.4, clearcoat: 0.4 });
  const yellow = new THREE.MeshStandardMaterial({ name: 'YellowHandle', color: '#ffcc20', roughness: 0.5 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'SlidingContact', color: '#172e40', roughness: 0.9 });
  const h = SIZE.thick;
  const base = new THREE.Mesh(new RoundedBoxGeometry(SIZE.length, h - 0.008, SIZE.width, 4, 0.012), paint);
  base.position.y = h / 2 + 0.004;
  body.add(base);
  const sole = new THREE.Mesh(new RoundedBoxGeometry(SIZE.length - 0.012, 0.012, SIZE.width - 0.012, 3, 0.004), rubber);
  sole.name = 'FlatContactPad';
  sole.position.y = 0.006;
  body.add(sole);
  // A solid carrying handle makes this read as lab equipment from the side and above.
  const handle = new THREE.CurvePath();
  handle.add(new THREE.LineCurve3(new THREE.Vector3(0, h, -0.075), new THREE.Vector3(0, h + 0.037, -0.075)));
  handle.add(
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, h + 0.037, -0.075),
      new THREE.Vector3(0, h + 0.05, 0),
      new THREE.Vector3(0, h + 0.037, 0.075),
    ),
  );
  handle.add(new THREE.LineCurve3(new THREE.Vector3(0, h + 0.037, 0.075), new THREE.Vector3(0, h, 0.075)));
  const grip = new THREE.Mesh(new THREE.TubeGeometry(handle, 36, 0.009, 12, false), yellow);
  grip.name = 'CarryingHandle';
  body.add(grip);
  // Yellow corner guards, rather than a printed cover or page edges.
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      const guard = new THREE.Mesh(new RoundedBoxGeometry(0.022, 0.022, 0.037, 3, 0.005), yellow);
      guard.position.set(x * (SIZE.length / 2 - 0.015), h - 0.006, z * (SIZE.width / 2 - 0.024));
      body.add(guard);
    }
  return { root, body, touchTarget: base };
}
