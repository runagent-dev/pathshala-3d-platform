// The street, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a wide town
// road of three lanes with dashed lane lines, kerbs painted black and white as on Bangladesh's roads, a tiled
// footpath on each side and a whitewashed wall along the far one. The truck runs in the far lane, the bicycle in
// the near one; the middle lane stays empty, so nothing of one lane ever sits over the other on screen. Beyond the
// footpaths the ground is near-white, like the page. Long enough for every run (x from -70 m to +70 m).
import * as THREE from 'three';

export const LANES = { far: -3.3, near: 3.5 };
export const ROAD = { half: 4.8, length: 140, kerb: 0.16 };

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

export function createStreet() {
  const root = new THREE.Group();
  root.name = 'Street';
  const L = ROAD.length;
  const W = ROAD.half * 2;

  // asphalt: 8 m of road in the texture (3 m dash, 5 m gap), 48 px per metre
  {
    const ppm = 48;
    const c = canvas(8 * ppm, Math.round(W * ppm));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8a8f95';
    ctx.fillRect(0, 0, c.width, c.height);
    const r = rand(7);
    for (let i = 0; i < 5200; i++) {
      const g = 112 + Math.floor(r() * 46);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 6},0.45)`;
      ctx.fillRect(r() * c.width, r() * c.height, 2, 2);
    }
    const zpx = (z) => (z + ROAD.half) * ppm; // canvas row of a z (the plane's v runs with z after the rotation)
    ctx.fillStyle = '#f1f1ec';
    for (const z of [-1.6, 1.6]) ctx.fillRect(0, zpx(z) - 4, 3 * ppm, 8); // lane dashes
    for (const z of [-ROAD.half + 0.22, ROAD.half - 0.22]) ctx.fillRect(0, zpx(z) - 4, c.width, 7); // edge lines
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(L, W),
      new THREE.MeshStandardMaterial({ name: 'Asphalt', map: texture(c, L / 8, 1), roughness: 0.93 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.name = 'Road';
    root.add(road);
  }

  // kerbs: black and white, half a metre each
  {
    const c = canvas(128, 8);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f2ee';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#2b2e33';
    ctx.fillRect(64, 0, 64, 8);
    const kerbMat = new THREE.MeshStandardMaterial({ name: 'Kerb', map: texture(c, L, 1), roughness: 0.8 });
    for (const z of [-ROAD.half - 0.11, ROAD.half + 0.11]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(L, ROAD.kerb, 0.22), kerbMat);
      kerb.position.set(0, ROAD.kerb / 2, z);
      kerb.receiveShadow = true;
      kerb.name = 'Kerb';
      root.add(kerb);
    }
  }

  // footpaths of square concrete tiles, 0.5 m
  {
    const c = canvas(64, 64);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#d9d8d2';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#bdbcb5';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    const tiles = new THREE.MeshStandardMaterial({ name: 'Tiles', map: texture(c, L / 0.5, 2.2 / 0.5), roughness: 0.95 });
    for (const z of [-ROAD.half - 0.22 - 1.1, ROAD.half + 0.22 + 1.1]) {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(L, 2.2), tiles);
      path.rotation.x = -Math.PI / 2;
      path.position.set(0, ROAD.kerb - 0.005, z);
      path.receiveShadow = true;
      path.name = 'Footpath';
      root.add(path);
    }
  }

  // the far wall: whitewashed, with a grey cap and a dark line at the foot
  {
    const wallMat = new THREE.MeshStandardMaterial({ name: 'Whitewash', color: '#efece4', roughness: 0.95 });
    const capMat = new THREE.MeshStandardMaterial({ name: 'WallCap', color: '#b9b4a8', roughness: 0.9 });
    const z = -ROAD.half - 2.55;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(L, 0.95, 0.24), wallMat);
    wall.position.set(0, ROAD.kerb + 0.475, z);
    wall.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.32), capMat);
    cap.position.set(0, ROAD.kerb + 0.985, z);
    wall.name = 'Wall';
    cap.name = 'WallCap';
    root.add(wall, cap);
  }

  // the ground beyond: near-white, like the page
  {
    const ground = new THREE.MeshStandardMaterial({ name: 'Ground', color: '#f3f4f1', roughness: 1 });
    const far = new THREE.Mesh(new THREE.PlaneGeometry(L, 60), ground);
    far.rotation.x = -Math.PI / 2;
    far.position.set(0, 0.0, -ROAD.half - 2.7 - 30);
    const near = new THREE.Mesh(new THREE.PlaneGeometry(L, 60), ground);
    near.rotation.x = -Math.PI / 2;
    near.position.set(0, ROAD.kerb - 0.01, ROAD.half + 2.42 + 30);
    far.receiveShadow = near.receiveShadow = true;
    far.name = near.name = 'Ground';
    root.add(far, near);
  }
  return { root };
}

/** A soft round shadow under a body (a texture, so it shows without real shadows too). */
export function blobShadow(length, width, opacity = 0.42) {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, `rgba(20, 26, 34, ${opacity})`);
  g.addColorStop(0.6, `rgba(20, 26, 34, ${opacity * 0.45})`);
  g.addColorStop(1, 'rgba(20, 26, 34, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(length, width), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = 1;
  m.userData.noExport = true;
  m.name = 'BlobShadow';
  return m;
}
