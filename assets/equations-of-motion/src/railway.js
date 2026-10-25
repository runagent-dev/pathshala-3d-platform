// A straight double-track railway, procedural three.js, in metres: two broad-gauge tracks (rails, concrete
// sleepers, ballast) along x, and a white post every 10 m beside the near track from the start (x = 0) on; the
// posts' numbers are drawn on the 2D overlay (app.js), so they stay readable at any size. Rail tops at y = 0.
import * as THREE from 'three';
import { GAUGE } from './train.js';

export const GROUND = -0.6; // the ground, under the ballast
export const TRACKS = { near: 4.4, far: -4.4 }; // z of each track's centre line (the camera looks from +z)
export const POST_Z = 7.9; // the posts stand in front of the near track
export const POST_EVERY = 10;
const FROM = -70;
const TO = 330;
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

export function createRailway() {
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
  const count = Math.floor(TO / POST_EVERY) + 1;
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

  return {
    root,
    /** Where a post stands on the ground (for its number on the overlay). */
    postFoot: (x, out = new THREE.Vector3()) => out.set(x, GROUND, POST_Z),
  };
}

/** The pale ground under the railway, fading into the white page at the sides (not exported). */
export function createGround() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(238, 240, 234, 0)');
  g.addColorStop(0.25, 'rgba(236, 238, 231, 1)');
  g.addColorStop(0.75, 'rgba(236, 238, 231, 1)');
  g.addColorStop(1, 'rgba(238, 240, 234, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(TO - FROM + 200, 30),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set((FROM + TO) / 2, GROUND - 0.01, 0);
  m.renderOrder = -1;
  m.userData.noExport = true;
  m.name = 'Ground';
  return m;
}
