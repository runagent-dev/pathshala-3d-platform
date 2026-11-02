// The setting, in metres: a calm sky (a soft blue gradient, no clouds) over a plain warm ground round the courtyard
// floor (./floor.js), and a soft blue backdrop behind it. No walls, houses, trees or pots: only the person, the crate, the tape and the wall of the
// second example draw the eye. Three meshes, never exported to the GLB, and neither casts or receives a shadow.
import * as THREE from 'three';
import { FLOOR } from './floor.js';

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5f87b3');
  g.addColorStop(0.42, '#9fbbd3');
  g.addColorStop(0.5, '#d4dfe6');
  g.addColorStop(0.52, '#c9bda5');
  g.addColorStop(1, '#b3a382');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createScenery() {
  const root = new THREE.Group();
  root.name = 'Courtyard';
  root.userData.noExport = true;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(58, 32, 16),
    new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.name = 'Sky';
  sky.position.set(2, 0, 0);
  sky.renderOrder = -1;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Ground', color: '#b39d76', roughness: 1, metalness: 0 }),
  );
  ground.name = 'Ground';
  ground.position.set(2, -0.012, 0);
  // a soft blue backdrop behind the floor, lighter low down (vertex colours, no texture)
  const geo = new THREE.PlaneGeometry(60, 8, 1, 6);
  const low = new THREE.Color('#cfdbe4');
  const high = new THREE.Color('#87a6c3');
  const col = new THREE.Color();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    col.lerpColors(low, high, pos.getY(i) / 8 + 0.5);
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ name: 'Backdrop', vertexColors: true, fog: false }));
  back.name = 'Backdrop';
  back.position.set(2, 4 - 0.012, FLOOR.z0 - 0.6);
  root.add(sky, ground, back);
  return { root };
}
