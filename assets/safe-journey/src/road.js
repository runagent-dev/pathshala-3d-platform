// The road, in metres (x along the road, +x to the right on screen; z toward the viewer; y up): a two-lane highway
// of grey asphalt with white edge lines and a dashed centre line, earth shoulders, grass verges, and near-white
// ground beyond, like the page. Long enough for every run (x from −60 m to +60 m). The truck and the car meet in
// the near lane.
import * as THREE from 'three';

export const ROAD = { half: 3.6, length: 120, lane: 1.2, shoulder: 0.9, verge: 3.2 };

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

/** A strip along the road at z (its middle), `width` wide, from a canvas texture tiled every `tile` m along x. */
function strip(name, c, length, width, z, tile, y = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshStandardMaterial({ name, map: texture(c, length / tile, 1), roughness: 0.95 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, y, z);
  m.receiveShadow = true;
  m.name = name;
  return m;
}

export function createRoad({ length = ROAD.length, scenery = true } = {}) {
  const root = new THREE.Group();
  root.name = 'Road';
  const W = ROAD.half * 2;
  const L = length;

  // asphalt: 8 m of road in the texture (a 3 m dash and a 5 m gap on the centre line), 48 px per metre
  {
    const ppm = 48;
    const c = canvas(8 * ppm, Math.round(W * ppm));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8b9096';
    ctx.fillRect(0, 0, c.width, c.height);
    const r = rand(7);
    for (let i = 0; i < 4200; i++) {
      const g = 112 + Math.floor(r() * 46);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 6},0.45)`;
      ctx.fillRect(r() * c.width, r() * c.height, 2, 2);
    }
    const zpx = (z) => (z + ROAD.half) * ppm; // canvas row of a z
    ctx.fillStyle = '#f1f1ec';
    ctx.fillRect(0, zpx(0) - 4, 3 * ppm, 8); // the centre dashes
    for (const z of [-ROAD.half + 0.2, ROAD.half - 0.2]) ctx.fillRect(0, zpx(z) - 4, c.width, 7); // edge lines
    root.add(strip('Asphalt', c, L, W, 0, 8));
  }
  // earth shoulders, a little lighter at the edge of the asphalt
  {
    const c = canvas(64, 32);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c9b796';
    ctx.fillRect(0, 0, 64, 32);
    const r = rand(3);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(120,98,64,${0.15 + r() * 0.2})`;
      ctx.fillRect(r() * 64, r() * 32, 2, 2);
    }
    for (const s of [-1, 1]) root.add(strip('Shoulder', c, L, ROAD.shoulder, s * (ROAD.half + ROAD.shoulder / 2), 2, -0.004));
  }
  // grass verges: soft green, a few darker tufts
  {
    const c = canvas(128, 64);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c7dcb0';
    ctx.fillRect(0, 0, 128, 64);
    const r = rand(5);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(92,140,70,${0.12 + r() * 0.22})`;
      ctx.fillRect(r() * 128, r() * 64, 2, 3);
    }
    for (const s of [-1, 1]) root.add(strip('Verge', c, L, ROAD.verge, s * (ROAD.half + ROAD.shoulder + ROAD.verge / 2), 4, -0.008));
  }
  if (!scenery) return { root };
  // the ground beyond: white, like the page (unlit, so it stays white)
  const edge = ROAD.half + ROAD.shoulder + ROAD.verge;
  {
    const ground = new THREE.MeshBasicMaterial({ name: 'Ground', color: '#ffffff', toneMapped: false });
    for (const s of [-1, 1]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(ROAD.length, 120), ground);
      g.rotation.x = -Math.PI / 2;
      g.position.set(0, -0.012, s * (edge + 60));
      g.name = 'Ground';
      g.userData.noExport = true;
      root.add(g);
    }
  }
  // beyond the far verge, pale paddy fields in rows (the trees stand on them), fading into the page
  {
    const c = canvas(64, 256);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#ffffff'); // far
    g.addColorStop(0.55, '#f1f5ea');
    g.addColorStop(1, '#e6eedb'); // near the road
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    for (let y = 120; y < 256; y += 9) {
      ctx.fillStyle = `rgba(150, 180, 120, ${0.05 + ((y - 120) / 136) * 0.12})`;
      ctx.fillRect(0, y, 64, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(ROAD.length / 8, 1);
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD.length, 34),
      new THREE.MeshBasicMaterial({ name: 'Fields', map: t, toneMapped: false }),
    );
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, -0.01, -(edge + 17));
    field.name = 'Fields';
    field.userData.noExport = true;
    root.add(field);
  }
  // a row of roadside trees beyond the far verge, in soft greens (scenery: not exported)
  {
    const r = rand(17);
    const trunkMat = new THREE.MeshStandardMaterial({ name: 'Trunk', color: '#8a6f55', roughness: 0.9 });
    const leaves = ['#b5cfa5', '#a9c79a', '#bfd6b0'].map(
      (c) => new THREE.MeshStandardMaterial({ name: 'Leaves', color: c, roughness: 0.95, flatShading: true }),
    );
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 8).translate(0, 0.5, 0);
    const crownGeo = new THREE.IcosahedronGeometry(1, 1);
    const trees = new THREE.Group();
    trees.name = 'Trees';
    trees.userData.noExport = true;
    for (let x = -ROAD.length / 2 + 4; x < ROAD.length / 2 - 4; x += 6.5 + r() * 2.5) {
      const tree = new THREE.Group();
      const h = 1.8 + r() * 0.6;
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.scale.y = h;
      tree.add(trunk);
      const m = leaves[Math.floor(r() * leaves.length)];
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(crownGeo, m);
        const s = 0.9 + r() * 0.5;
        c.scale.set(s * 1.2, s * 0.85, s);
        c.position.set((i - 1) * 0.75 + (r() - 0.5) * 0.4, h + 0.5 + r() * 0.5, (r() - 0.5) * 0.8);
        tree.add(c);
      }
      tree.position.set(x, 0, -(edge + 1.4 + r() * 2.2));
      trees.add(tree);
    }
    root.add(trees);
  }
  return { root };
}

/** A soft shadow under a body (a texture, so the vehicles sit on the road without real shadows too). */
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
