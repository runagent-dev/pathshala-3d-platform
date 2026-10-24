// Halley's comet (হ্যালির ধূমকেতু) going round the Sun on an ellipse (উপবৃত্তাকার কক্ষপথ), as a model in metres:
// the Sun at one focus, the comet's icy head and its tail, which always points away from the Sun and grows long
// only near it. The orbit lies in the xy plane, perihelion on +x. Not to scale: the real orbit is much thinner
// (e = 0.967), drawn here with e = 0.86 so the slow and fast parts can both be seen.
import * as THREE from 'three';
import { dashedPath } from './parts.js';
import { EXAMPLES, TAU, orbitAt, orbitAtAnomaly, phaseOfAnomaly } from './motion.js';

const A = 0.8; // semi-major axis of the model, m
const E = EXAMPLES.comet.e;
const SUN_R = 0.052;
const B = A * Math.sqrt(1 - E * E); // semi-minor axis

function gradientSprite(stops, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true, toneMapped: false }));
  sprite.userData.noExport = true;
  return sprite;
}

/** The tail: a flat fan of light, bright at the head and fading away, lying along +x from the origin. */
function tailMesh() {
  const W = 256;
  const H = 64;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'rgba(66, 153, 225, 0.95)');
  grad.addColorStop(0.35, 'rgba(116, 192, 252, 0.6)');
  grad.addColorStop(1, 'rgba(165, 216, 255, 0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, H / 2 - 4);
  g.quadraticCurveTo(W * 0.5, 2, W, 0);
  g.lineTo(W, H);
  g.quadraticCurveTo(W * 0.5, H - 2, 0, H / 2 + 4);
  g.closePath();
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(1, 0.26);
  geo.translate(0.5, 0, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
  );
  mesh.name = 'Tail';
  mesh.renderOrder = 3;
  return mesh;
}

export function createComet() {
  const root = new THREE.Group();
  root.name = 'HalleyOrbit';
  const model = new THREE.Group(); // what the GLB gets: the Sun and the comet
  model.name = 'SunAndComet';
  root.add(model);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_R, 48, 24),
    new THREE.MeshStandardMaterial({ name: 'Sun', color: 0xffc233, emissive: 0xff9f1a, emissiveIntensity: 1.1, roughness: 0.9 }),
  );
  sun.name = 'Sun';
  model.add(sun);
  const halo = gradientSprite([
    [0, 'rgba(255, 196, 61, 0.75)'],
    [0.35, 'rgba(255, 196, 61, 0.28)'],
    [1, 'rgba(255, 196, 61, 0)'],
  ]);
  halo.scale.set(SUN_R * 5, SUN_R * 5, 1);
  root.add(halo);

  const comet = new THREE.Group();
  comet.name = 'Comet';
  model.add(comet);
  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.017, 2),
    new THREE.MeshStandardMaterial({ name: 'CometHead', color: 0x5c6670, roughness: 0.85, flatShading: true }),
  );
  head.scale.set(1.2, 0.9, 1);
  comet.add(head);
  const coma = gradientSprite([
    [0, 'rgba(214, 236, 255, 0.95)'],
    [0.3, 'rgba(116, 192, 252, 0.55)'],
    [1, 'rgba(116, 192, 252, 0)'],
  ]);
  coma.scale.set(0.09, 0.09, 1);
  comet.add(coma);
  const tail = tailMesh();
  tail.userData.noExport = true;
  comet.add(tail);

  // the orbit (drawn), sampled evenly round the ellipse
  const pts = [];
  for (let i = 0; i < 200; i++) {
    const o = orbitAtAnomaly((i / 200) * TAU, E, A);
    pts.push(new THREE.Vector3(o.x, o.y, 0));
  }
  const path = dashedPath(new THREE.CatmullRomCurve3(pts, true), { radius: 0.0042, dash: 0.05, closed: true, segments: 400 });
  root.add(path);

  const samples = [];
  for (let i = 0; i < 360; i++) {
    const Ei = (i / 360) * TAU;
    const o = orbitAtAnomaly(Ei, E, A);
    samples.push({ p: new THREE.Vector3(o.x, o.y, 0), phase: phaseOfAnomaly(Ei, E) });
  }

  const away = new THREE.Vector3();
  return {
    id: 'comet',
    root,
    model,
    setPhase(phase) {
      const o = orbitAt(phase, E, A);
      comet.position.set(o.x, o.y, 0);
      // the tail points away from the Sun and is long only near it
      away.set(o.x, o.y, 0).normalize();
      tail.rotation.z = Math.atan2(away.y, away.x);
      const near = (A * (1 - E)) / o.r; // 1 at perihelion
      const len = 0.06 + 0.26 * near ** 1.2;
      tail.scale.set(len, 0.55 + 0.6 * Math.min(1, near * 1.3), 1);
      coma.scale.setScalar(0.07 + 0.04 * Math.min(1, near * 1.5));
    },
    samples,
    phaseOfSample: (s) => s.phase,
    markPose(phase) {
      const o = orbitAt(phase, E, A);
      const vel = new THREE.Vector3(o.vx, o.vy, 0);
      const across = new THREE.Vector3(-o.vy, o.vx, 0).normalize();
      return { pos: new THREE.Vector3(o.x, o.y, 0.002), across, vel };
    },
    normal: new THREE.Vector3(0, 0, 1),
    particle: () => comet.getWorldPosition(new THREE.Vector3()),
    sun: () => sun.getWorldPosition(new THREE.Vector3()),
    markLength: 0.085,
    arrowThickness: 0.0052,
    velocityScale: 0.02,
    views: {
      front: new THREE.Vector3(0, 0, 1),
      '3d': new THREE.Vector3(0.18, -0.62, 0.76).normalize(),
    },
    bounds: new THREE.Box3(new THREE.Vector3(-A * (1 + E) - 0.012, -B - 0.012, -0.02), new THREE.Vector3(A * (1 - E) + 0.07, B + 0.012, 0.02)),
    ground: null,
  };
}
