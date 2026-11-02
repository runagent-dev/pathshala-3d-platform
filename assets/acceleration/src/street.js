// The straight road the CNG drives, in metres (x east, z south, y up), repeating without end so the CNG can drive
// on for as long as the student likes (follow(x) keeps the pieces round the CNG; the pattern repeats, so nothing
// jumps): two lanes of asphalt with a dashed centre line, kerbs painted black and white (as on Bangladesh's roads),
// on soft sand, nothing else.
import * as THREE from 'three';

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const texture = (c, repeatX = 1, repeatY = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
};

export const ROAD = { width: 7, lane: -1.75, period: 48, dash: 6 };

export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  const L = ROAD.period * 3; // the pieces cover 144 m round the CNG; the fog hides the ends
  const half = ROAD.width / 2;

  // asphalt with the dashed centre line and the white edge lines, one dash period (6 m) in the texture
  {
    const c = canvas(384, 448); // 64 px per metre
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7b8086';
    ctx.fillRect(0, 0, 384, 448);
    const r = rand(3);
    for (let i = 0; i < 2600; i++) {
      const g = 100 + Math.floor(r() * 50);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 6},0.5)`;
      ctx.fillRect(r() * 384, r() * 448, 2, 2);
    }
    ctx.fillStyle = '#f3f3ee';
    ctx.fillRect(0, 224 - 5, 192, 10); // the centre dash: 3 m painted, 3 m not
    ctx.fillRect(0, 13, 384, 7); // edge lines
    ctx.fillRect(0, 448 - 20, 384, 7);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(L, ROAD.width),
      new THREE.MeshStandardMaterial({ name: 'Asphalt', map: texture(c, L / ROAD.dash, 1), roughness: 0.92 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.name = 'Road';
    root.add(road);
  }
  // kerbs painted black and white, half a metre each (a stripe texture on one long block per side)
  {
    const c = canvas(128, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f2ee';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#2a2d31';
    ctx.fillRect(64, 0, 64, 8);
    const kerbMat = new THREE.MeshStandardMaterial({ name: 'Kerb', map: texture(c, L, 1), roughness: 0.8 });
    for (const z of [-half - 0.1, half + 0.1]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.2), kerbMat);
      kerb.position.set(0, 0.07, z);
      kerb.receiveShadow = true;
      root.add(kerb);
    }
  }
  // shoulders of packed earth, then soft sand
  {
    const earth = new THREE.MeshStandardMaterial({ name: 'Earth', color: '#d9c9a8', roughness: 1 });
    for (const z of [-half - 0.95, half + 0.95]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.5), earth);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.005, z);
      s.receiveShadow = true;
      root.add(s);
    }
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(L, 80), new THREE.MeshStandardMaterial({ name: 'Ground', color: '#ddd1b8', roughness: 1 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    grass.receiveShadow = true;
    root.add(grass);
  }
  // nothing else beside the road (no trees, bushes or tufts): the CNG is the one thing to look at

  return {
    root,
    /** Keep the road round the CNG (the patterns repeat every 48 m, so the jump does not show). */
    follow(x) {
      root.position.x = Math.round(x / ROAD.period) * ROAD.period;
    },
  };
}
