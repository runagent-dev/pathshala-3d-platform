// The 3D scene (metres): a smooth, flat track (the book's সমতল) with a straight line along it (the সরলরেখা the
// balls move on) and a mark every 10 cm along its front edge, and two balls whose size follows their mass (all of
// the same material). The balls are told apart by size, a neutral tint (m₁ dark slate, m₂ ivory) and their labels,
// never by the colours of the quantities (velocity blue, momentum green, energy amber).
import * as THREE from 'three';
import { radiusOf } from './collision.js';

export const TRACK = { length: 3.2, depth: 0.42, thick: 0.04 };
export const BALL_TINTS = { 1: '#5d6977', 2: '#ece5d4' };

/** A soft round shadow under a ball (always shown; the real shadow comes on top when shadows are on). */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(20, 28, 38, 0.42)');
  grad.addColorStop(0.45, 'rgba(20, 28, 38, 0.2)');
  grad.addColorStop(1, 'rgba(20, 28, 38, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTrack() {
  const root = new THREE.Group();
  root.name = 'Track';
  const top = new THREE.MeshPhysicalMaterial({
    name: 'TrackTop',
    color: 0xe9edf1,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
  });
  const side = new THREE.MeshStandardMaterial({ name: 'TrackEdge', color: 0xb9c2cc, roughness: 0.5, metalness: 0.2 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(TRACK.length, TRACK.thick, TRACK.depth), [side, side, top, side, side, side]);
  board.name = 'Board';
  board.position.y = -TRACK.thick / 2;
  board.receiveShadow = true;
  root.add(board);
  // the straight line the balls move along
  const lineMat = new THREE.MeshBasicMaterial({
    name: 'Line',
    color: 0x8a96a3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(TRACK.length, 0.005), lineMat);
  line.name = 'StraightLine';
  line.rotation.x = -Math.PI / 2;
  line.position.y = 0.0005;
  root.add(line);
  // a mark every 10 cm along the front edge (longer every 50 cm), so speeds can be seen against the track
  const n = Math.round(TRACK.length / 0.1) + 1;
  const ticks = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.004, 1), lineMat, n);
  ticks.name = 'Marks';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  for (let i = 0; i < n; i++) {
    const x = -TRACK.length / 2 + i * 0.1;
    const long = Math.abs(Math.round(x * 10) % 5) === 0;
    const len = long ? 0.05 : 0.028;
    m.compose(new THREE.Vector3(x, 0.0006, TRACK.depth / 2 - 0.012 - len / 2), q, new THREE.Vector3(1, len, 1));
    ticks.setMatrixAt(i, m);
  }
  root.add(ticks);
  return { root };
}

/** A ball of mass m (kg), resting on the track (its centre at y = r). */
export function createBall(index, m) {
  const root = new THREE.Group();
  root.name = `Ball${index}`;
  const mat = new THREE.MeshPhysicalMaterial({
    name: `Ball${index}Material`,
    color: BALL_TINTS[index],
    roughness: index === 1 ? 0.3 : 0.26,
    metalness: index === 1 ? 0.45 : 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
  });
  const geo = new THREE.SphereGeometry(1, 48, 32);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `Ball${index}Sphere`;
  mesh.castShadow = true;
  root.add(mesh);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.0008;
  blob.renderOrder = 1;
  blob.userData.noExport = true;
  root.add(blob);
  // a bigger invisible ball: a finger anywhere near the ball takes it
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  hit.userData.ball = index;
  root.add(hit);
  let r = 0;
  function setMass(mass) {
    r = radiusOf(mass);
    mesh.scale.setScalar(r);
    mesh.position.y = r;
    blob.scale.setScalar(r * 2.6);
    hit.scale.setScalar(r * 1.7);
    hit.position.y = r;
  }
  setMass(m);
  return {
    root,
    mesh,
    hit,
    material: mat,
    setMass,
    get r() {
      return r;
    },
  };
}
