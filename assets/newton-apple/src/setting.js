// The setting: a late-summer meadow, a high soft sky, and the measuring pole. Everything is painted once on canvases, so
// it draws in very few calls: the far ground and the sky fade into each other at a hazy horizon; a near patch of ground
// (with the tree's dappled shade, which is painted, not computed) and a few thousand short tufts give the close detail.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
const HAZE = '#e6d9b8'; // the far ground and the bottom of the sky meet in this colour

function skyTexture() {
  const w = 1024;
  const h = 512;
  const c = canvas(w, h);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#2a68b0');
  grad.addColorStop(0.3, '#4a8bcf');
  grad.addColorStop(0.42, '#6ea9e0');
  grad.addColorStop(0.47, '#a5cbe8');
  grad.addColorStop(0.492, '#dbe5dc');
  grad.addColorStop(0.5, HAZE);
  grad.addColorStop(1, HAZE);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  // soft fair-weather clouds, in rows that thin out with height
  const rand = rng(31);
  for (let i = 0; i < 26; i++) {
    const x = rand() * w;
    const y = h * (0.36 + rand() * 0.125);
    const sx = 30 + rand() * 80;
    for (let j = 0; j < 12; j++) {
      const px = x + (rand() - 0.5) * sx * 2;
      const py = y - rand() * sx * 0.16;
      const r = sx * (0.14 + rand() * 0.24);
      for (const dx of [0, w, -w]) {
        const b = g.createRadialGradient(px + dx, py, 0, px + dx, py, r);
        b.addColorStop(0, 'rgba(255,255,255,0.5)');
        b.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = b;
        g.fillRect(px + dx - r, py - r, r * 2, r * 2);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** The dappled shade under the crown and the meadow's mown bands, drawn on the near patch. */
function nearTexture(size, extent, trunk) {
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const rand = rng(17);
  const px = (m) => ((m + extent / 2) / extent) * size;
  g.fillStyle = '#a79a4e';
  g.fillRect(0, 0, size, size);
  // broad patches of paler and greener grass
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 30 + rand() * 110;
    const b = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = rand();
    const col = tone < 0.4 ? '122,132,52' : tone < 0.75 ? '196,170,92' : '150,146,62';
    b.addColorStop(0, `rgba(${col},0.22)`);
    b.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = b;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine blades
  for (let i = 0; i < 26000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const l = 2 + rand() * 6;
    const tone = rand();
    g.strokeStyle =
      tone < 0.45
        ? `rgba(84,96,36,${0.14 + rand() * 0.3})`
        : tone < 0.8
          ? `rgba(206,184,106,${0.12 + rand() * 0.28})`
          : `rgba(58,66,26,${0.15 + rand() * 0.25})`;
    g.lineWidth = 0.6 + rand() * 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rand() - 0.5) * 4, y - l);
    g.stroke();
  }
  // the crown's shade, cast away from the sun: soft and dappled
  const sx = px(trunk.x + 1.4);
  const sy = px(trunk.z - 1.3);
  const R = (3.4 / extent) * size;
  g.save();
  g.translate(sx, sy);
  g.scale(1.15, 0.88);
  const shade = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
  shade.addColorStop(0, 'rgba(38,46,22,0.6)');
  shade.addColorStop(0.72, 'rgba(38,46,22,0.5)');
  shade.addColorStop(1, 'rgba(38,46,22,0)');
  g.fillStyle = shade;
  g.fillRect(-R, -R, R * 2, R * 2);
  g.restore();
  for (let i = 0; i < 150; i++) {
    const a = rand() * Math.PI * 2;
    const r = R * Math.sqrt(rand()) * 0.9;
    const x = sx + Math.cos(a) * r * 1.15;
    const y = sy + Math.sin(a) * r * 0.88;
    const s = 5 + rand() * 13;
    const b = g.createRadialGradient(x, y, 0, x, y, s);
    b.addColorStop(0, 'rgba(226,206,120,0.4)');
    b.addColorStop(1, 'rgba(226,206,120,0)');
    g.fillStyle = b;
    g.fillRect(x - s, y - s, s * 2, s * 2);
  }
  // bare earth and roots' shade at the foot of the trunk
  const foot = g.createRadialGradient(px(trunk.x), px(trunk.z), 0, px(trunk.x), px(trunk.z), (1.2 / extent) * size);
  foot.addColorStop(0, 'rgba(58,46,30,0.72)');
  foot.addColorStop(1, 'rgba(58,46,30,0)');
  g.fillStyle = foot;
  g.fillRect(0, 0, size, size);
  // the patch's edge melts into the far ground
  g.globalCompositeOperation = 'destination-in';
  const fade = g.createRadialGradient(size / 2, size / 2, size * 0.34, size / 2, size / 2, size * 0.5);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function farTexture() {
  const size = 512;
  const c = canvas(size, size);
  const g = c.getContext('2d');
  const rand = rng(3);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#a4974c');
  grad.addColorStop(0.2, '#ae9f58');
  grad.addColorStop(0.55, '#c9bb82');
  grad.addColorStop(1, HAZE);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 40;
    const b = g.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, 'rgba(120,126,58,0.13)');
    b.addColorStop(1, 'rgba(120,126,58,0)');
    g.fillStyle = b;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Short tufts of grass as a pale cut-out, tinted per tuft. */
function tuftTexture() {
  const c = canvas(128, 128);
  const g = c.getContext('2d');
  const rand = rng(9);
  for (let i = 0; i < 26; i++) {
    const x = 18 + rand() * 92;
    const lean = (rand() - 0.5) * 34;
    const tone = 170 + Math.floor(rand() * 85);
    g.strokeStyle = `rgb(${tone},${tone},${tone * 0.9})`;
    g.lineWidth = 2 + rand() * 2.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, 128);
    g.quadraticCurveTo(x + lean * 0.2, 80, x + lean, 20 + rand() * 62);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Keep clear of the apples' landing line, so the apple on the grass stays whole. */
const isClear = (x, z) => !(x > 0.4 && x < 2.05 && z > 0.5 && z < 1.2);

export function createMeadow({ trunk, shadow = true }) {
  const root = new THREE.Group();
  root.name = 'Meadow';
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(170, 32, 16),
    new THREE.MeshBasicMaterial({ name: 'Sky', map: skyTexture(), side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }),
  );
  sky.name = 'Sky';
  sky.rotation.y = 2.2;
  sky.userData.noExport = true;
  sky.renderOrder = -10;
  root.add(sky);

  const far = new THREE.Mesh(
    new THREE.CircleGeometry(165, 48),
    new THREE.MeshBasicMaterial({ name: 'FarGround', map: farTexture(), toneMapped: false }),
  );
  far.name = 'FarGround';
  far.rotation.x = -Math.PI / 2;
  far.position.y = -0.03;
  far.userData.noExport = true;
  root.add(far);

  const EXT = 24;
  const near = new THREE.Mesh(
    new THREE.PlaneGeometry(EXT, EXT),
    new THREE.MeshStandardMaterial({
      name: 'Grass',
      map: nearTexture(1024, EXT, trunk),
      roughness: 1,
      metalness: 0,
      transparent: true,
      depthWrite: true,
    }),
  );
  near.name = 'Ground';
  near.rotation.x = -Math.PI / 2;
  near.receiveShadow = shadow;
  root.add(near);

  // short tufts round the scene
  const rand = rng(21);
  const place = [];
  while (place.length < 3200) {
    const x = -7.5 + rand() * 15;
    const z = -4.5 + rand() * 10;
    if (isClear(x, z) && Math.hypot(x - trunk.x, z - trunk.z) > 0.5) place.push([x, z]);
  }
  const card = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const tuftMat = new THREE.MeshBasicMaterial({ name: 'Tufts', map: tuftTexture(), alphaTest: 0.5, side: THREE.DoubleSide });
  const tufts = new THREE.InstancedMesh(card, tuftMat, place.length);
  tufts.name = 'Tufts';
  tufts.userData.noExport = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  const A = new THREE.Color('#938f45');
  const B = new THREE.Color('#c9b768');
  place.forEach(([x, z], i) => {
    const size = 0.05 + rand() * 0.07;
    m.compose(p.set(x, 0, z), q.setFromEuler(e.set(0, rand() * 1.2 - 0.6, 0)), s.set(size * 1.5, size, 1));
    tufts.setMatrixAt(i, m);
    tufts.setColorAt(i, col.lerpColors(A, B, rand()).multiplyScalar(0.85 + rand() * 0.2));
  });
  tufts.instanceMatrix.needsUpdate = true;
  tufts.frustumCulled = false;
  root.add(tufts);
  return { root, ground: near };
}

/** The height pole: a surveyor's staff in red and white half-metres with a plate at each metre, standing in the plane of the fall. */
export function createPole({ x, z, N, unit = 'm' }) {
  const root = new THREE.Group();
  root.name = 'HeightPole';
  const H = 5.4;
  const c = canvas(32, 1024);
  const g = c.getContext('2d');
  const band = (H / 0.5) | 0;
  for (let i = 0; i <= band; i++) {
    g.fillStyle = i % 2 ? '#f4f1ea' : '#c0392b';
    const y = 1024 - ((i * 0.5) / H) * 1024;
    g.fillRect(0, y - (0.5 / H) * 1024, 32, (0.5 / H) * 1024);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const staff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, H, 10),
    new THREE.MeshStandardMaterial({ name: 'Pole', map: t, roughness: 0.6 }),
  );
  staff.name = 'Staff';
  staff.position.set(x, H / 2, z);
  staff.castShadow = true;
  root.add(staff);
  const plateGeo = new THREE.BoxGeometry(0.36, 0.17, 0.012);
  const plateMat = new THREE.MeshStandardMaterial({ name: 'Plate', color: '#fbfaf5', emissive: '#fbfaf5', emissiveIntensity: 0.35, roughness: 0.55 });
  const tickMat = new THREE.MeshStandardMaterial({ name: 'Tick', color: '#20262e', roughness: 0.6 });
  const tickGeo = new THREE.BoxGeometry(0.11, 0.012, 0.07);
  // one draw call each for the five plates and the five ticks
  const plates = new THREE.InstancedMesh(plateGeo, plateMat, 5);
  plates.name = 'Plates';
  const ticks = new THREE.InstancedMesh(tickGeo, tickMat, 5);
  ticks.name = 'Ticks';
  const m = new THREE.Matrix4();
  for (let h = 1; h <= 5; h++) {
    plates.setMatrixAt(h - 1, m.makeTranslation(x + 0.24, h, z + 0.03));
    ticks.setMatrixAt(h - 1, m.makeTranslation(x, h, z));
    const text = textMesh(`${N(String(h))} ${unit}`, 0.125, { color: '#20262e', weight: 700 });
    text.position.set(x + 0.24, h, z + 0.038);
    root.add(text);
  }
  root.add(plates, ticks);
  return { root, x, z };
}
