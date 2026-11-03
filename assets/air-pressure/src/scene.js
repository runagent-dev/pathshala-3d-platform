// The world, in metres: a plain soft floor under a gentle sky and a plain table (its top is y = 0) for the tin box;
// far off to the right, where the student stands for the body part, nothing but the same floor; and the Earth seen from
// space (shown only in the body's space steps). Everything procedural and modest in triangles.
import * as THREE from 'three';

export const GROUND = -0.76; // the yard, below the table's top
export const PERSON_AT = new THREE.Vector3(9, GROUND, 0); // far from the table, so it never shows behind the student
const EARTH_R = 7;
const EARTH_AT = new THREE.Vector3(PERSON_AT.x + 12, GROUND - EARTH_R - 1.2, PERSON_AT.z - 30);

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

// a little deterministic randomness
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The sky behind everything: a soft, slightly muted blue to a warm haze at the horizon (screen space). */
export function skyTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#7ea6cf');
    s.addColorStop(0.45, '#a9c6e2');
    s.addColorStop(0.8, '#dfe6ec');
    s.addColorStop(1, '#efe3d2');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Space, for "what if there were no air": deep blue-black with stars (still a picture, never flat black). */
export function spaceTexture() {
  return canvasTex(512, 512, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 512);
    s.addColorStop(0, '#060b24');
    s.addColorStop(0.7, '#0d1b4a');
    s.addColorStop(1, '#1b3a7a');
    g.fillStyle = s;
    g.fillRect(0, 0, 512, 512);
    const r = rng(11);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
      const d = r() < 0.08 ? 2.4 : 1.2;
      g.fillRect(r() * 512, r() * 512, d, d);
    }
  });
}

/** The wooden lab table: a warm oiled top with a darker edge, four legs to the yard. */
function createTable() {
  const g = new THREE.Group();
  g.name = 'Table';
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.045, 0.72), std('#a08470', { roughness: 0.6 }));
  top.position.set(-0.05, -0.0225, -0.02);
  top.receiveShadow = true;
  top.castShadow = true;
  g.add(top);
  const legMat = std('#6b3a1c', { roughness: 0.6 });
  for (const x of [-0.66, 0.56])
    for (const z of [-0.33, 0.29]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, -GROUND - 0.045, 0.05), legMat);
      leg.position.set(x, (GROUND - 0.045) / 2, z);
      leg.castShadow = true;
      g.add(leg);
    }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.62), legMat);
  rail.position.set(-0.05, -0.08, -0.02);
  g.add(rail);
  return g;
}

/** The Earth seen from space, for the body's second and third steps: oceans, land, clouds and a thin blue glow. */
function createEarth() {
  const g = new THREE.Group();
  g.name = 'Earth';
  const tex = canvasTex(512, 256, (c, w, h) => {
    const sea = c.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#1d4f91');
    sea.addColorStop(0.5, '#2a6fb8');
    sea.addColorStop(1, '#1d4f91');
    c.fillStyle = sea;
    c.fillRect(0, 0, w, h);
    const r = rng(29);
    // land: clusters of soft blobs, green and brown
    for (let k = 0; k < 9; k++) {
      const cx = r() * w;
      const cy = h * (0.25 + r() * 0.5);
      for (let i = 0; i < 26; i++) {
        const x = cx + (r() - 0.5) * 90;
        const y = cy + (r() - 0.5) * 50;
        c.fillStyle = r() < 0.65 ? '#4f8a3c' : '#a08452';
        c.beginPath();
        c.ellipse(x, y, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, Math.PI * 2);
        c.fill();
      }
    }
    // clouds
    c.globalAlpha = 0.7;
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      c.beginPath();
      c.ellipse(r() * w, h * (0.15 + r() * 0.7), 8 + r() * 22, 1.5 + r() * 3, (r() - 0.5) * 0.4, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  });
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R, 64, 32),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0, fog: false }),
  );
  globe.rotation.set(1.1, -0.6, 0.1); // the equator toward the camera, not a pole
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.035, 64, 32),
    new THREE.MeshBasicMaterial({ color: '#6fb6ff', transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  g.add(glow, globe);
  g.position.copy(EARTH_AT);
  return g;
}

/** A clear blue sky for the body on the Earth: deeper blue above, pale near the horizon, a few soft clouds. */
export function bodySkyTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h);
    s.addColorStop(0, '#4f8fd6');
    s.addColorStop(0.55, '#8ec0ec');
    s.addColorStop(0.85, '#d3e8f7');
    s.addColorStop(1, '#efe6d6');
    g.fillStyle = s;
    g.fillRect(0, 0, w, h);
    const r = rng(5);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (const [cx, cy, k] of [
      [40, 60, 1],
      [205, 40, 0.8],
      [150, 120, 0.6],
    ])
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.ellipse(cx + (r() - 0.5) * 40 * k, cy + (r() - 0.5) * 8 * k, (12 + r() * 14) * k, (6 + r() * 5) * k, 0, 0, Math.PI * 2);
        g.fill();
      }
  });
}

/** Everything round the box and the student. `outdoors` (the floor, the table) goes away in space. */
export function createWorld() {
  const root = new THREE.Group();
  root.name = 'Yard';
  const outdoors = new THREE.Group();
  outdoors.name = 'Outdoors';
  root.add(outdoors);
  // a plain, soft floor: nothing round the box but the table it stands on (the owner: one clear object)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), std('#c9b8a3', { roughness: 0.95 }));
  ground.position.y = GROUND;
  ground.receiveShadow = true;
  outdoors.add(ground);
  const table = createTable();
  outdoors.add(table);
  const earth = createEarth();
  earth.visible = false;
  root.add(earth);
  return { root, outdoors, table, earth };
}
