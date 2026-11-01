// The molecules, drawn far below the room so a second camera can look at them: three small close-ups for the
// magnifier (a solid, a liquid, a gas, each against what holds it) and the big one, a piece of the balloon's wall
// seen from inside with gas molecules hitting it. Every position is a function of time only (motion.js).
import * as THREE from 'three';
import { bounce, random, sinceHitHi } from './motion.js';

export const MOLECULE = '#2b59c3'; // gas, liquid and solid molecules: one colour (the same molecules)
export const FOCUS = '#f6b40e'; // the one molecule we follow
const BG_LENS = '#d6ecff';

const CENTRE = {
  solid: new THREE.Vector3(-30, -40, 0),
  liquid: new THREE.Vector3(-20, -40, 0),
  gas: new THREE.Vector3(-10, -40, 0),
  wall: new THREE.Vector3(10, -40, 0),
};

function moleculeMaterial(name) {
  return new THREE.MeshPhysicalMaterial({ name, color: '#ffffff', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
}
const sphere = new THREE.SphereGeometry(1, 22, 16);

function instanced(name, n) {
  const m = new THREE.InstancedMesh(sphere, moleculeMaterial(name), n);
  m.name = name;
  m.frustumCulled = false;
  const c = new THREE.Color(MOLECULE);
  for (let i = 0; i < n; i++) m.setColorAt(i, c);
  return m;
}

function bar(w, h, d, color, x, y, opacity = 1) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.6, transparent: opacity < 1, opacity }),
  );
  m.position.set(x, y, 0);
  return m;
}

function backdrop(colour, size = 3) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color: colour, toneMapped: false }));
  m.position.z = -0.6;
  return m;
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
function put(mesh, i, x, y, z, r, sy = r) {
  mesh.setMatrixAt(i, M.compose(P.set(x, y, z), Q, S.set(r, sy, r)));
}

/** The three magnifier close-ups. Each fits a 1 × 1 square around its centre. */
function buildStates() {
  const rnd = random(7);
  // solid: a neat lattice resting on the table, each molecule shaking in its place
  const solid = new THREE.Group();
  solid.name = 'SolidMolecules';
  solid.position.copy(CENTRE.solid);
  const lattice = [];
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) lattice.push([-0.39 + i * 0.13, -0.33 + j * 0.13, -0.08 - k * 0.13, rnd() * 6.28]);
  const solidMesh = instanced('SolidLattice', lattice.length);
  solid.add(backdrop(BG_LENS), solidMesh, bar(1.4, 0.12, 0.6, '#7b4524', 0, -0.46));

  // liquid: close together, sliding past each other, in a glass container (bottom and sides)
  const liquid = new THREE.Group();
  liquid.name = 'LiquidMolecules';
  liquid.position.copy(CENTRE.liquid);
  const drops = [];
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 7; i++)
      drops.push([-0.36 + i * 0.12 + (j % 2) * 0.05 + (rnd() - 0.5) * 0.03, -0.33 + j * 0.115, -0.05 - rnd() * 0.12, rnd() * 6.28, 0.5 + rnd()]);
  const liquidMesh = instanced('LiquidDrops', drops.length);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.5),
    new THREE.MeshBasicMaterial({ color: '#a8d4ff', transparent: true, opacity: 0.7, toneMapped: false }),
  );
  water.position.set(0, -0.155, -0.3);
  liquid.add(
    backdrop(BG_LENS),
    water,
    liquidMesh,
    bar(0.98, 0.05, 0.5, '#8fc9ef', 0, -0.43, 0.9),
    bar(0.05, 0.75, 0.5, '#8fc9ef', -0.46, -0.08, 0.9),
    bar(0.05, 0.75, 0.5, '#8fc9ef', 0.46, -0.08, 0.9),
  );

  // gas: far apart and fast, bouncing off every wall of a closed box
  const gas = new THREE.Group();
  gas.name = 'GasMolecules';
  gas.position.copy(CENTRE.gas);
  const flies = [];
  for (let i = 0; i < 11; i++) {
    const a = rnd() * 6.28;
    const s = 0.45 + rnd() * 0.35;
    flies.push([rnd() * 0.7 - 0.35, rnd() * 0.7 - 0.35, -0.05 - rnd() * 0.15, s * Math.cos(a), s * Math.sin(a)]);
  }
  const gasMesh = instanced('GasFlies', flies.length);
  gas.add(
    backdrop(BG_LENS),
    gasMesh,
    bar(0.98, 0.05, 0.5, '#8fc9ef', 0, -0.46, 0.9),
    bar(0.98, 0.05, 0.5, '#ff7a1a', 0, 0.46, 1),
    bar(0.05, 0.97, 0.5, '#8fc9ef', -0.46, 0, 0.9),
    bar(0.05, 0.97, 0.5, '#8fc9ef', 0.46, 0, 0.9),
  );

  function update(t) {
    lattice.forEach(([x, y, z, ph], i) => put(solidMesh, i, x + 0.012 * Math.sin(9 * t + ph), y + 0.012 * Math.sin(11 * t + 2 * ph), z, 0.058));
    solidMesh.instanceMatrix.needsUpdate = true;
    drops.forEach(([x, y, z, ph, f], i) => {
      // a slow wander plus a shared sideways drift: neighbours change as they slide
      const dx = 0.05 * Math.sin(f * t + ph) + 0.03 * Math.sin(0.6 * t + y * 6);
      const dy = 0.025 * Math.sin(1.3 * f * t + 2 * ph);
      put(liquidMesh, i, Math.max(-0.38, Math.min(0.38, x + dx)), Math.max(-0.35, y + dy), z, 0.056);
    });
    liquidMesh.instanceMatrix.needsUpdate = true;
    flies.forEach(([x, y, z, vx, vy], i) => put(gasMesh, i, bounce(x, vx, t, -0.38, 0.38), bounce(y, vy, t, -0.38, 0.38), z, 0.05));
    gasMesh.instanceMatrix.needsUpdate = true;
  }
  return { solid, liquid, gas, update };
}

/**
 * Inside the balloon: the wall (rubber) along y = 0 with the outside above it, gas molecules below. In local units;
 * the group is turned so the wall is at the top on tall screens and on the right on wide ones.
 */
export const WALL = { A: 1.15, B: 1.15, r: 0.045, thick: 0.09 };
function buildWall() {
  const { A, B, r, thick } = WALL;
  const g = new THREE.Group();
  g.name = 'InsideBalloon';
  g.position.copy(CENTRE.wall);
  const bg = document.createElement('canvas');
  bg.width = 8;
  bg.height = 256;
  const c = bg.getContext('2d');
  const grad = c.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#ffe7a8'); // light through yellow rubber, warm
  grad.addColorStop(0.58, '#fff3cf');
  grad.addColorStop(0.5801, '#173f93'); // outside: the room's blue wall
  grad.addColorStop(1, '#2457c5');
  c.fillStyle = grad;
  c.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(bg);
  tex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  // the blue starts at 58% of the height: put that just above the wall
  back.position.set(0, -0.58 * 6 + 3 + thick, -0.7);
  const rubber = new THREE.Mesh(
    new THREE.BoxGeometry(6, thick, 1.6),
    new THREE.MeshStandardMaterial({
      name: 'RubberWall',
      color: '#ffb703',
      emissive: new THREE.Color('#ff9f00'),
      emissiveIntensity: 0.55,
      roughness: 0.4,
    }),
  );
  rubber.name = 'RubberWall';
  rubber.position.y = thick / 2;
  const rnd = random(11);
  const mols = [];
  for (let i = 0; i < 52; i++) {
    const a = 0.35 + rnd() * 2.45; // mostly up or down, so they reach the wall often
    const s = 0.5 + rnd() * 0.3;
    const vy = s * Math.sin(a) * (rnd() < 0.5 ? 1 : -1);
    mols.push({ x: rnd() * 2 * A - A, y: -B + rnd() * (B - r), z: -0.35 + rnd() * 0.5, vx: s * Math.cos(a), vy });
  }
  const mesh = instanced('GasMoleculesInside', mols.length);
  const focus = new THREE.Mesh(sphere, new THREE.MeshPhysicalMaterial({ name: 'FocusMolecule', color: FOCUS, roughness: 0.2, clearcoat: 1 }));
  focus.name = 'FocusMolecule';
  focus.visible = false;
  g.add(back, rubber, mesh, focus);
  const dim = new THREE.Color();
  const base = new THREE.Color(MOLECULE);
  const pale = new THREE.Color('#c7c3e6');

  /** Molecule clock tau; `dimmed` 0…1 fades the others while we follow one. */
  function update(tau, dimmed = 0) {
    mols.forEach((m, i) => {
      put(mesh, i, bounce(m.x, m.vx, tau, -A, A), bounce(m.y, m.vy, tau, -B, -r), m.z, r);
      mesh.setColorAt(i, dim.copy(base).lerp(pale, dimmed));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  /** The molecules that touched the wall less than `within` (tau) ago: { x, z, age, speed } in local units. */
  function hits(tau, within) {
    const out = [];
    for (const m of mols) {
      const age = sinceHitHi(m.y, m.vy, tau, -B, -r);
      if (age < within) out.push({ x: bounce(m.x, m.vx, tau - age, -A, A), z: m.z, age, speed: Math.abs(m.vy) });
    }
    return out;
  }
  /** Local position of molecule i (for its label). */
  function positionOf(i, tau, out) {
    const m = mols[i];
    return out.set(bounce(m.x, m.vx, tau, -A, A), bounce(m.y, m.vy, tau, -B, -r), m.z);
  }
  return { group: g, mesh, focus, update, hits, positionOf, count: mols.length };
}

export function buildMicro() {
  const states = buildStates();
  const wall = buildWall();
  const group = new THREE.Group();
  group.name = 'Molecules';
  group.userData.noExport = true;
  group.add(states.solid, states.liquid, states.gas, wall.group);
  return { group, states, wall, CENTRE, BG_LENS };
}
