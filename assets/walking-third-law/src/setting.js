// Where the student walks: a school yard on a clear morning. Behind the path, a grey cement yard with its joints and
// stains, and the school's plain plastered boundary wall with a grey coping, against a morning sky (nothing else: only
// the main objects). Warm neutrals and a blue sky, so the orange and crimson force arrows stand out; nothing white
// and no wide green. Everything is still, merged into a few meshes (one per material), and none of it casts shadows;
// the yard receives the student's shadow.
import * as THREE from 'three';

const YARD = { x0: -12, x1: 14, z0: -4.2, z1: -0.4 };
const WALL = { z: -4.2, h: 1.65, thick: 0.22, x0: -12, x1: 14 };

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

  // behind the yard only a plain plastered boundary wall with its coping, in soft warm colours (the owner: only the main
  // objects, so no school building, trees, pillars or bricks)
  const wallLen = WALL.x1 - WALL.x0;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(wallLen, WALL.h, WALL.thick),
    new THREE.MeshStandardMaterial({ name: 'BoundaryWall', color: '#dcc7a2', roughness: 0.92, metalness: 0 }),
  );
  wall.position.set((WALL.x0 + WALL.x1) / 2, WALL.h / 2, WALL.z);
  wall.name = 'BoundaryWall';
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(wallLen, 0.07, WALL.thick + 0.06),
    new THREE.MeshStandardMaterial({ name: 'Coping', color: '#9a958c', roughness: 0.85, metalness: 0 }),
  );
  top.position.set((WALL.x0 + WALL.x1) / 2, WALL.h + 0.035, WALL.z);
  top.name = 'Coping';
  root.add(wall, top);

  return { root };
}
