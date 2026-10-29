// A straight double-track railway, procedural three.js, in metres: two broad-gauge tracks (rails, concrete
// sleepers, ballast) along x, and a white post every 10 m beside the near track from the start (x = 0) on; the
// posts' numbers are drawn on the 2D overlay (app.js), so they stay readable at any size. Rail tops at y = 0. Round it
// the sunny setting: grass, a row of trees behind the far track (createGround, not exported).
import * as THREE from 'three';
import { GAUGE } from './train.js';

export const GROUND = -0.6; // the ground, under the ballast
export const TRACKS = { near: 4.4, far: -4.4 }; // z of each track's centre line (the camera looks from +z)
export const POST_Z = 7.1; // the posts stand in front of the near track
export const POST_EVERY = 10;
const SLEEPER_GAP = 0.62;

/** A long prism along x with this cross-section [(z, y), …] (counter-clockwise seen from +x). */
function prism(section, x0, x1, material) {
  const pos = [];
  const index = [];
  const n = section.length;
  for (const x of [x0, x1]) for (const [z, y] of section) pos.push(x, y, z);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    index.push(i, n + j, j, i, n + i, n + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return new THREE.Mesh(flat, material);
}

/** The railway from x = from to x = to (m); the figure shows −70 to 330 m, the GLB a short stretch. */
export function createRailway({ from: FROM = -70, to: TO = 330 } = {}) {
  const root = new THREE.Group();
  root.name = 'Railway';
  const ballastMat = new THREE.MeshStandardMaterial({ name: 'Ballast', color: 0xbdb6aa, roughness: 1, metalness: 0 });
  const sleeperMat = new THREE.MeshStandardMaterial({ name: 'Sleeper', color: 0x8e9194, roughness: 0.9, metalness: 0 });
  const railMat = new THREE.MeshStandardMaterial({ name: 'Rail', color: 0x9aa2aa, roughness: 0.32, metalness: 0.85 });
  const postMat = new THREE.MeshStandardMaterial({ name: 'Post', color: 0xf4f5f6, roughness: 0.55, metalness: 0 });
  const capMat = new THREE.MeshStandardMaterial({ name: 'PostCap', color: 0x2b3138, roughness: 0.6, metalness: 0 });
  const startMat = new THREE.MeshStandardMaterial({ name: 'StartPost', color: 0x2f9e44, roughness: 0.55, metalness: 0 });

  const railY = -0.15; // rails 0.15 m tall, sleepers under them
  const sleeperCount = Math.floor((TO - FROM) / SLEEPER_GAP);
  const sleeperGeo = new THREE.BoxGeometry(0.26, 0.17, 2.7);
  const dummy = new THREE.Object3D();
  for (const z of [TRACKS.near, TRACKS.far]) {
    // ballast: a flat-topped bank of stones
    root.add(
      prism(
        [
          [z + 2.4, GROUND],
          [z + 1.75, railY - 0.1],
          [z - 1.75, railY - 0.1],
          [z - 2.4, GROUND],
        ],
        FROM,
        TO,
        ballastMat,
      ),
    );
    const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperCount);
    for (let i = 0; i < sleeperCount; i++) {
      dummy.position.set(FROM + i * SLEEPER_GAP, railY - 0.06, z);
      dummy.updateMatrix();
      sleepers.setMatrixAt(i, dummy.matrix);
    }
    sleepers.name = 'Sleepers';
    root.add(sleepers);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(TO - FROM, 0.15, 0.075), railMat);
      rail.position.set((FROM + TO) / 2, railY + 0.075, z + side * (GAUGE / 2 + 0.036));
      rail.name = 'Rail';
      rail.receiveShadow = true;
      root.add(rail);
    }
    sleepers.receiveShadow = true;
  }
  root.children[0].receiveShadow = true;

  // posts every 10 m from the start; the start post is green
  const count = Math.max(1, Math.floor(TO / POST_EVERY) + 1);
  const postGeo = new THREE.BoxGeometry(0.16, 1.2, 0.16);
  const capGeo = new THREE.BoxGeometry(0.2, 0.22, 0.2);
  const posts = new THREE.InstancedMesh(postGeo, postMat, count - 1);
  const caps = new THREE.InstancedMesh(capGeo, capMat, count - 1);
  for (let k = 1; k < count; k++) {
    dummy.position.set(k * POST_EVERY, GROUND + 0.6, POST_Z);
    dummy.updateMatrix();
    posts.setMatrixAt(k - 1, dummy.matrix);
    dummy.position.y = GROUND + 1.3;
    dummy.updateMatrix();
    caps.setMatrixAt(k - 1, dummy.matrix);
  }
  posts.name = 'DistancePosts';
  caps.name = 'DistancePostCaps';
  posts.castShadow = caps.castShadow = true;
  const start = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.7, 0.2), startMat);
  start.position.set(0, GROUND + 0.85, POST_Z);
  start.name = 'StartPost';
  start.castShadow = true;
  root.add(posts, caps, start);

  return { root };
}

/** Where the land ends behind the far track: a row of trees stands there, the sky is behind them. */
export const HORIZON_Z = TRACKS.far - 4.6;

/**
 * The sunny setting (not exported to the GLB): grass on both sides of the tracks, a little lighter far away, and a
 * row of round trees along the back edge, so the sky shows above them. The trees are made the same way every time
 * (a fixed sequence of numbers), so the pictures never change.
 */
export function createGround({ from: FROM = -70, to: TO = 330 } = {}) {
  const root = new THREE.Group();
  root.name = 'Ground';
  root.userData.noExport = true;
  // grass: from the row of trees to well in front of the posts, a soft stripe pattern along the track
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#a9d98a');
  g.addColorStop(0.3, '#93cd6f');
  g.addColorStop(1, '#7fbf5c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const depth = POST_Z + 40 - HORIZON_Z;
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(TO - FROM + 200, depth),
    new THREE.MeshStandardMaterial({ name: 'Grass', map: tex, roughness: 1, metalness: 0 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set((FROM + TO) / 2, GROUND - 0.01, HORIZON_Z + depth / 2);
  grass.receiveShadow = true;
  grass.name = 'Grass';
  root.add(grass);

  // the row of trees: a trunk and a round crown each, in two greens
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const spots = [];
  for (let x = FROM - 40; x < TO + 60; x += 5.5 + rand() * 4)
    spots.push({ x, z: HORIZON_Z - 0.9 - rand() * 1.2, h: 0.9 + rand() * 0.9, r: 1.25 + rand() * 0.6, k: rand() });
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1, 7);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ name: 'Trunk', color: 0x8a5a36, roughness: 0.9 }), spots.length);
  const crownMat = new THREE.MeshStandardMaterial({ name: 'Leaves', color: 0xffffff, roughness: 0.85, flatShading: true });
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, spots.length);
  const dummy = new THREE.Object3D();
  const greens = [new THREE.Color('#3f9e3a'), new THREE.Color('#5cb346'), new THREE.Color('#2f8a3a')];
  spots.forEach((p, i) => {
    dummy.position.set(p.x, GROUND + p.h / 2, p.z);
    dummy.scale.set(1, p.h, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x, GROUND + p.h + p.r * 0.55, p.z);
    dummy.scale.set(p.r, p.r * 0.92, p.r);
    dummy.rotation.set(0, p.k * 6, 0);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
    crowns.setColorAt(i, greens[Math.floor(p.k * greens.length) % greens.length]);
  });
  trunks.name = 'Trunks';
  crowns.name = 'Trees';
  root.add(trunks, crowns);
  return root;
}
