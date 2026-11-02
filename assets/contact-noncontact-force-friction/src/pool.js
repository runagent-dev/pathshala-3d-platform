// The test's new cases (not on the page), each a small scene that keeps moving: update(t) draws it at time t (s),
// looping. Real size, metres. Each has the same marks as the book's examples, shown with the answer: the contact
// patch (marks: true in update) or gap() for the measured gap.
//  - parachute: a student comes down under an open parachute; the air below the canopy holds it back.
import * as THREE from 'three';
import { createArrow } from './arrow.js';
import { createPerson } from './person.js';
import { mergeStatic } from './merge.js';
import { V, castShadows, glowSpot, mat, placeTube, tube } from './parts.js';
import { skySetting } from './setting.js';

const frac = (x) => x - Math.floor(x);
// ── a student under an open parachute ────────────────────────────────────────────────────────────────────────
export function createParachuteScene({ color, setting = true }) {
  const sky = setting ? skySetting() : null;
  const root = new THREE.Group();
  root.name = 'ParachuteScene';
  const model = new THREE.Group();
  model.name = 'Parachute';
  root.add(model);
  const R = 1.35; // canopy radius
  const RIM_Y = 3.05;
  const GORES = 12;

  const canopy = new THREE.Group();
  canopy.position.y = RIM_Y;
  model.add(canopy);
  const colorsGore = ['#1d3a6b', '#f4f1e8']; // navy and cream: the orange patch on the cloth and the sky both stand out
  const goreMats = colorsGore.map((c, i) => new THREE.MeshStandardMaterial({ name: `Canopy${i}`, color: c, roughness: 0.7, side: THREE.DoubleSide }));
  for (let i = 0; i < GORES; i++) {
    const geo = new THREE.SphereGeometry(R, 4, 10, (i * Math.PI * 2) / GORES, (Math.PI * 2) / GORES, 0, Math.PI * 0.42);
    const g = new THREE.Mesh(geo, goreMats[i % 2]);
    g.scale.y = 0.62;
    g.position.y = -R * Math.cos(Math.PI * 0.42) * 0.62;
    canopy.add(g);
  }
  const rimR = R * Math.sin(Math.PI * 0.42);
  const top = R * 0.62 * (1 - Math.cos(Math.PI * 0.42));

  const person = createPerson({ shirt: '#f4f6f8' });
  person.root.rotation.y = -Math.PI / 2; // facing the viewer
  model.add(person.root);
  const lineMat = mat('#4b5563', { roughness: 0.6 });
  const lines = [];
  const anchors = [];
  for (let i = 0; i < GORES; i += 1) {
    const a = (i * Math.PI * 2) / GORES;
    anchors.push(V(Math.cos(a) * rimR, RIM_Y, Math.sin(a) * rimR));
    lines.push(tube(V(0, 0, 0), V(0, 1, 0), 0.005, lineMat, model));
  }
  // air rushing past (it comes down, so the air goes up past it)
  const airMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false });
  const air = Array.from({ length: 9 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.012), airMat);
    m.userData.noExport = true;
    m.userData.x = -1.5 + (i * 3) / 8 + (i % 2 ? 0.12 : -0.08);
    m.userData.p = (i * 0.37) % 1;
    root.add(m);
    return m;
  });
  castShadows(model);
  mergeStatic(canopy); // twelve gores: two meshes, one per colour

  const arrow = createArrow({ color, radius: 0.028, head: 0.17, headRadius: 0.07 });
  root.add(arrow.root);
  // the contact patch: the canopy's cloth, which the air below it touches
  const spot = glowSpot(color, 0.95);
  root.add(spot);
  const hands = [V(0.05, 1.72, 0.2), V(0.05, 1.72, -0.2)];
  const handW = new THREE.Vector3();
  const v = new THREE.Vector3();
  const touch = new THREE.Vector3();

  function update(t, { arrowOn = false, marks = false } = {}) {
    const sway = Math.sin(t * 1.3) * 0.035;
    model.rotation.z = sway;
    person.pose({ lean: 0, hands, walk: Math.PI / 2, stride: 0.06, spread: 0.08, lift: 0.03 });
    model.updateMatrixWorld(true);
    for (let i = 0; i < lines.length; i++) {
      handW.copy(person.handAt(i % 2 ? 1 : 0));
      person.root.localToWorld(handW);
      model.worldToLocal(handW);
      placeTube(lines[i], anchors[i], handW, 0.005);
    }
    for (const a of air) {
      const p = frac(a.userData.p + t * 0.55);
      a.position.set(a.userData.x, -0.2 + p * 3.8, -0.6);
      a.visible = Math.abs(a.position.x) > rimR * 0.9 || a.position.y < RIM_Y - 0.4;
    }
    arrow.setOpacity(arrowOn ? 1 : 0);
    if (arrowOn)
      arrow.set(v.set(-Math.sin(sway) * (RIM_Y + top), Math.cos(sway) * (RIM_Y + top) + 0.02, 0), V(-Math.sin(sway), Math.cos(sway), 0), 0.75);
    touch.set(0, RIM_Y + top * 0.35, rimR * 0.5).applyMatrix4(model.matrixWorld);
    spot.position.copy(touch);
    spot.visible = marks;
  }

  return {
    id: 'parachute',
    root,
    background: sky?.background ?? null,
    model,
    hits: [],
    arrow,
    fit: { min: V(-1.5, -0.05, -0.5), max: V(1.5, RIM_Y + top + 0.85, 0.5) },
    views: { front: V(0.1, 0.05, 1).normalize(), '3d': V(0.7, 0.3, 0.8).normalize() },
    shadow: { center: V(0, 1.5, 0), r: 2.5 },
    update,
    /** The canopy's underside, where the air pushes on it. */
    contact: () => touch,
    gap: () => null,
    bodies: () => [
      { min: V(-rimR, RIM_Y - 0.1, -rimR), max: V(rimR, RIM_Y + top, rimR) },
      { min: V(-0.3, 0, -0.3), max: V(0.3, 1.75, 0.3) },
    ],
  };
}
