// The Moon (চাঁদ) going round the Earth (পৃথিবী), seen from above the North Pole: anticlockwise, the same face
// always towards the Earth (as the real Moon). Stylised, in scene centimetres: the real Moon is about 30 Earths
// away and takes about 27 days per turn; here the sizes, the distance and the time are not to scale (the figure
// says so). Nothing ties the Moon to the Earth: there is no rod, no string, only the dashed line of the drawing.
// The orbit's plane is horizontal (world y up); in the plane, +z points up and angle 0 (+y) is "up" on the screen.
import * as THREE from 'three';
import { earthTexture, moonTexture } from './globe.js';

export const MOON = { r: 60, earth: 19.5, moon: 7.2, tilt: 23.4 };

export function createMoon({ renderer }) {
  const root = new THREE.Group();
  root.name = 'EarthAndMoon';
  // the orbit's plane: local x = world x, local y = world −z, local z = world y (up)
  const plane = new THREE.Group();
  plane.name = 'OrbitPlane';
  plane.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0)),
  );
  root.add(plane);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // the Earth: its axis tilted away from the viewer, Asia (and Bangladesh) turned towards them
  const earthTilt = new THREE.Group();
  earthTilt.name = 'EarthAxis';
  earthTilt.rotation.x = THREE.MathUtils.degToRad(-MOON.tilt);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(MOON.earth, 72, 48),
    new THREE.MeshStandardMaterial({ name: 'Earth', map: earthTexture(aniso), roughness: 0.78, metalness: 0 }),
  );
  earth.name = 'Earth';
  earth.rotation.y = THREE.MathUtils.degToRad(180 + 8);
  earthTilt.add(earth);
  root.add(earthTilt);

  // the Moon turns with its orbit, so its near side (the middle of the map) always faces the Earth
  const spin = new THREE.Group();
  spin.name = 'Orbit';
  plane.add(spin);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON.moon, 48, 32),
    new THREE.MeshStandardMaterial({ name: 'Moon', map: moonTexture(aniso), roughness: 0.95, metalness: 0 }),
  );
  moon.name = 'Moon';
  moon.position.set(0, MOON.r, 0);
  // the sphere's +x (the map's middle) towards the Earth (−y), its poles along the orbit's axis (z)
  moon.quaternion.setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0)),
  );
  spin.add(moon);

  // a generous invisible target around the Moon, so a finger finds it on a phone
  const hit = new THREE.Mesh(new THREE.SphereGeometry(MOON.moon * 2, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  hit.position.copy(moon.position);
  spin.add(hit);

  // sunlight from one side (not exported)
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-260, 180, 160);
  sun.userData.noExport = true;
  sun.target.userData.noExport = true;
  root.add(sun, sun.target);

  // a point of a part, in the world (written into `out`, so labels that follow it every frame allocate nothing)
  const local =
    (obj, x, y, z) =>
    (out = new THREE.Vector3()) =>
      obj.localToWorld(out.set(x, y, z));
  return {
    id: 'moon',
    root,
    plane,
    spin,
    r: MOON.r,
    lift: 0,
    pointSize: 0.02, // the Moon itself is the moving thing: only a small dot at its centre
    endSize: MOON.moon, // what the labels keep clear of at the moving end
    hub: MOON.earth, // the Earth round the fixed point
    guide: true, // the whole orbit drawn faintly from the start: in empty space the circle has nothing else to show it
    fit: { radius: MOON.r + MOON.moon + 2, depth: 14 },
    views: { front: new THREE.Vector3(0, 0.96, 0.28).normalize(), '3d': new THREE.Vector3(0.52, 0.5, 0.69).normalize() },
    grab: [hit],
    lights: [sun],
    setAngle(deg) {
      spin.rotation.z = THREE.MathUtils.degToRad(deg);
    },
    tags: {
      earth: local(root, -MOON.earth * 0.6, MOON.earth * 0.75, -MOON.earth * 0.3), // upper left, as seen from above
      moon: local(spin, 0, MOON.r, MOON.moon),
    },
    exportRoot: root,
  };
}
