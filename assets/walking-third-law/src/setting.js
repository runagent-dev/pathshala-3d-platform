// Where the student walks: a school yard on a clear morning. Behind the path, a grey cement yard with its joints and
// stains, the school's boundary wall (red brick at the foot, lime-washed yellow above, a grey coping and square
// pillars), and over the wall a two-storey school building and a few trees (a mango tree and a flame tree, কৃষ্ণচূড়া)
// against a morning sky. Warm neutrals and a blue sky, so the orange and crimson force arrows stand out; nothing white
// and no wide green. Everything is still, merged into a few meshes (one per material), and none of it casts shadows;
// the yard receives the student's shadow.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';

const YARD = { x0: -12, x1: 14, z0: -4.2, z1: -0.4 };
const WALL = { z: -4.2, h: 1.65, thick: 0.22, x0: -12, x1: 14, pillarEvery: 2.6 };

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function canvasTexture(w, h, draw, { repeatX = 1, repeatY = 1, anisotropy = 4 } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

function blotches(g, w, h, rnd, n, rgb, alpha, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rMin + rnd() * (rMax - rMin);
    const a = alpha * (0.4 + rnd() * 0.6);
    for (const dx of [-w, 0, w])
      for (const dy of [-h, 0, h]) {
        const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        grad.addColorStop(0, `rgba(${rgb},${a})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = grad;
        g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      }
  }
}

/** Grey cement yard: 2 m slabs with dark joints, stains and wear; one picture is 4 m square. */
function yardTexture(anisotropy) {
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      const rnd = rng(3);
      g.fillStyle = '#9d988f';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, rnd, 50, '120,114,104', 0.45, 20, 80);
      blotches(g, w, h, rnd, 30, '182,176,164', 0.4, 20, 70);
      blotches(g, w, h, rnd, 10, '92,84,72', 0.35, 30, 60);
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = ['#7f7a72', '#b4afa5', '#8d877d', '#c2bcb1'][Math.floor(rnd() * 4)];
        g.globalAlpha = 0.35 + rnd() * 0.4;
        g.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
      }
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(70,64,58,0.8)';
      g.lineWidth = 3;
      for (const p of [0, w / 2, w]) {
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(w, p);
        g.stroke();
      }
    },
    { repeatX: (YARD.x1 - YARD.x0) / 4, repeatY: (YARD.z1 - YARD.z0) / 4, anisotropy },
  );
}

/** The wall's face: brick to 0.45 m, then yellow lime-wash with its streaks; one picture is 2.6 m wide, the wall high. */
function wallTexture(anisotropy) {
  return canvasTexture(
    512,
    256,
    (g, w, h) => {
      const rnd = rng(9);
      const brickTop = h * (1 - 0.45 / WALL.h);
      g.fillStyle = '#e2b955';
      g.fillRect(0, 0, w, brickTop);
      blotches(g, w, brickTop, rnd, 40, '238,204,120', 0.5, 10, 40);
      blotches(g, w, brickTop, rnd, 26, '196,150,70', 0.35, 10, 36);
      // rain streaks under the coping and damp near the bricks
      for (let i = 0; i < 26; i++) {
        const x = rnd() * w;
        const grad = g.createLinearGradient(0, 0, 0, 40 + rnd() * 60);
        grad.addColorStop(0, 'rgba(120,96,60,0.35)');
        grad.addColorStop(1, 'rgba(120,96,60,0)');
        g.fillStyle = grad;
        g.fillRect(x, 0, 2 + rnd() * 4, 100);
      }
      const damp = g.createLinearGradient(0, brickTop - 26, 0, brickTop);
      damp.addColorStop(0, 'rgba(110,90,60,0)');
      damp.addColorStop(1, 'rgba(110,90,60,0.35)');
      g.fillStyle = damp;
      g.fillRect(0, brickTop - 26, w, 26);
      // a painted blue band
      g.fillStyle = '#3d6e9c';
      g.fillRect(0, brickTop - 10, w, 6);
      // bricks: courses of 7.5 cm, half-brick bond
      g.fillStyle = '#8a5a46';
      g.fillRect(0, brickTop, w, h - brickTop);
      const course = h * (0.075 / WALL.h);
      const brick = w * (0.25 / 2.6);
      for (let r = 0, y = brickTop; y < h; r++, y += course)
        for (let x = r % 2 ? -brick / 2 : 0; x < w; x += brick) {
          const tone = 0.85 + rnd() * 0.3;
          g.fillStyle = `rgb(${Math.round(168 * tone)},${Math.round(84 * tone)},${Math.round(58 * tone)})`;
          g.fillRect(x + 1, y + 1, brick - 2, course - 2);
        }
    },
    { repeatX: (WALL.x1 - WALL.x0) / 2.6, anisotropy },
  );
}

/** The school building's front: two floors of verandahs with blue doors and windows and white rails. */
function facadeTexture(anisotropy) {
  return canvasTexture(
    512,
    256,
    (g, w, h) => {
      const rnd = rng(17);
      g.fillStyle = '#e7c98f';
      g.fillRect(0, 0, w, h);
      blotches(g, w, h, rnd, 20, '205,170,110', 0.35, 10, 40);
      const floor = h / 2;
      for (let f = 0; f < 2; f++) {
        const y0 = f * floor;
        // the verandah's shade, the rooms' doors and windows inside it
        g.fillStyle = '#9c7f5c';
        g.fillRect(0, y0 + floor * 0.22, w, floor * 0.7);
        for (let k = 0; k < 4; k++) {
          const x = (k + 0.5) * (w / 4);
          g.fillStyle = '#2f5d8a';
          g.fillRect(x - 26, y0 + floor * 0.34, 18, floor * 0.56);
          g.fillStyle = '#4a7cab';
          g.fillRect(x + 6, y0 + floor * 0.38, 30, floor * 0.3);
          g.fillStyle = '#1f3e5e';
          for (let b = 1; b < 4; b++) g.fillRect(x + 6 + b * 7.5, y0 + floor * 0.38, 1.5, floor * 0.3);
        }
        // columns and the rail
        g.fillStyle = '#efdcb4';
        for (let k = 0; k <= 8; k++) g.fillRect((k * w) / 8 - 6, y0 + floor * 0.2, 12, floor * 0.8);
        g.fillStyle = '#f2ead6';
        g.fillRect(0, y0 + floor * 0.72, w, 4);
        for (let x = 0; x < w; x += 10) g.fillRect(x, y0 + floor * 0.72, 2, floor * 0.2);
        // the slab between floors
        g.fillStyle = '#c9a66e';
        g.fillRect(0, y0 + floor * 0.12, w, floor * 0.1);
      }
      g.fillStyle = '#b48f58';
      g.fillRect(0, 0, w, 8);
    },
    { anisotropy },
  );
}

/** The morning sky: deep blue overhead to a warm haze at the horizon, with a few soft clouds. */
export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#3f7fc4');
  grad.addColorStop(0.55, '#86b6e2');
  grad.addColorStop(1, '#f1dcb6');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const rnd = rng(29);
  for (let i = 0; i < 7; i++) {
    const x = rnd() * 256;
    const y = 30 + rnd() * 90;
    for (let k = 0; k < 6; k++) {
      const r = 10 + rnd() * 16;
      const cx = x + (rnd() - 0.5) * 50;
      const cy = y + (rnd() - 0.5) * 8;
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      cg.addColorStop(0, 'rgba(255,255,255,0.55)');
      cg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cg;
      g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSetting({ anisotropy = 4 } = {}) {
  const root = new THREE.Group();
  root.name = 'SchoolYard';
  root.userData.noExport = true;

  // the cement yard behind the path (it takes the student's shadow)
  const yardMat = new THREE.MeshStandardMaterial({ name: 'Yard', map: yardTexture(anisotropy), roughness: 0.9, metalness: 0 });
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(YARD.x1 - YARD.x0, YARD.z1 - YARD.z0), yardMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set((YARD.x0 + YARD.x1) / 2, -0.002, (YARD.z0 + YARD.z1) / 2);
  yard.receiveShadow = true;
  yard.name = 'Yard';
  root.add(yard);

  // the plain painted parts share one vertex-coloured material
  const paintMat = new THREE.MeshStandardMaterial({ name: 'YardPaint', vertexColors: true, roughness: 0.85, metalness: 0 });
  const plain = (color) => new THREE.MeshStandardMaterial({ color });
  const coping = plain('#8f8c86');
  const pillar = plain('#d9ac4a');
  const pillarCap = plain('#7d7a74');
  const roof = plain('#a98a5c');
  const trunk = plain('#5b4330');
  const painted = [coping, pillar, pillarCap, roof, trunk];

  const scenery = new THREE.Group();
  root.add(scenery);
  const wallMat = new THREE.MeshStandardMaterial({ name: 'BoundaryWall', map: wallTexture(anisotropy), roughness: 0.92, metalness: 0 });
  const wallLen = WALL.x1 - WALL.x0;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallLen, WALL.h), wallMat);
  wall.position.set((WALL.x0 + WALL.x1) / 2, WALL.h / 2, WALL.z + WALL.thick / 2);
  scenery.add(wall);
  const top = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 0.07, WALL.thick + 0.06), coping);
  top.position.set((WALL.x0 + WALL.x1) / 2, WALL.h + 0.035, WALL.z);
  scenery.add(top);
  for (let x = WALL.x0 + 1.3; x < WALL.x1; x += WALL.pillarEvery) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, WALL.h + 0.12, WALL.thick + 0.12), pillar);
    p.position.set(x, (WALL.h + 0.12) / 2, WALL.z);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, WALL.thick + 0.2), pillarCap);
    cap.position.set(x, WALL.h + 0.155, WALL.z);
    scenery.add(p, cap);
  }

  // the school building over the wall, and its roof's edge
  const facadeMat = new THREE.MeshStandardMaterial({ name: 'SchoolFront', map: facadeTexture(anisotropy), roughness: 0.9, metalness: 0 });
  const building = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), facadeMat);
  facadeMat.map.repeat.set(16 / 12, 1);
  building.position.set(2.5, 3, -9.5);
  scenery.add(building);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(16.3, 0.35, 0.4), roof);
  parapet.position.set(2.5, 6.15, -9.4);
  scenery.add(parapet);

  // trees between the wall and the building: a mango tree, a flame tree (কৃষ্ণচূড়া) in flower and a jackfruit tree.
  // Each crown is a few overlapping clumps of leaves, smoothly shaded, their colour varying across the leaves (vertex
  // colours, in the same material as the painted parts: no extra shader); the trunks are merged with the wall's parts.
  const trees = [
    // x, z, height of the crown, size, colours (shadow, leaf, sunlit)
    { x: -4.4, z: -7.2, y: 3.0, r: 1.1, c: ['#2f4f2a', '#46703a', '#7c9a4e'] },
    { x: -1.2, z: -7.6, y: 3.2, r: 1.0, c: ['#8f2a1c', '#c4482a', '#e98a3d'] },
    { x: 8.6, z: -7.0, y: 2.9, r: 1.05, c: ['#33522c', '#4f7a3d', '#87a35a'] },
  ];
  for (const t of trees) {
    const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, t.y, 8), trunk);
    trunkMesh.position.set(t.x, t.y / 2, t.z);
    scenery.add(trunkMesh);
  }
  mergeStatic(scenery, { keep: [wall, building], paint: { from: painted, material: paintMat } });

  const crownGeos = [];
  for (const [i, t] of trees.entries()) {
    const rnd = rng(41 + i);
    const shadow = new THREE.Color(t.c[0]);
    const leaf = new THREE.Color(t.c[1]);
    const lit = new THREE.Color(t.c[2]);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + rnd();
      const r = t.r * (k === 0 ? 0.95 : 0.55 + rnd() * 0.25);
      const cx = t.x + (k === 0 ? 0 : Math.cos(a) * t.r * 0.75);
      const cy = t.y + (k === 0 ? 0.15 : (rnd() - 0.3) * t.r * 0.6);
      const cz = t.z + (k === 0 ? 0 : Math.sin(a) * t.r * 0.4);
      let geo = mergeVertices(new THREE.IcosahedronGeometry(1, 3), 1e-4);
      geo.deleteAttribute('uv');
      geo.deleteAttribute('normal');
      geo = mergeVertices(geo, 1e-4);
      const pos = geo.attributes.position;
      const rgb = new Float32Array(pos.count * 3);
      const c = new THREE.Color();
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        const y = pos.getY(v);
        const z = pos.getZ(v);
        // a lumpy outline of leaf clusters
        const bump = 1 + 0.09 * Math.sin(x * 7 + i) * Math.sin(y * 6 + k) * Math.sin(z * 5) + (rnd() - 0.5) * 0.05;
        pos.setXYZ(v, x * bump, y * bump * 0.85, z * bump);
        // darker underneath and inside, sunlit on top, leaf by leaf a little different
        const up = (y + 1) / 2;
        c.copy(shadow)
          .lerp(leaf, Math.min(1, up * 1.4))
          .lerp(lit, Math.max(0, up - 0.55) * 1.2);
        c.multiplyScalar(0.9 + rnd() * 0.2);
        c.toArray(rgb, v * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
      geo.scale(r, r, r);
      geo.translate(cx, cy, cz);
      geo.computeVertexNormals();
      crownGeos.push(geo);
    }
  }
  const crownMesh = new THREE.Mesh(mergeGeometries(crownGeos), paintMat);
  for (const g of crownGeos) g.dispose();
  crownMesh.name = 'TreeCrowns';
  root.add(crownMesh);

  return { root };
}
