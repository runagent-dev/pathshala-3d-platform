// The setting, in metres (the platform's top is y = 0): a calm evening-blue backdrop (screen space), a round teak
// platform the two barometers and the person stand on, a dark stone floor round it that fades into the backdrop; the
// measuring staff beside the water tube (0–11 m, its 0 at the liquids' surface; the numbers are kept a steady size on
// the screen by the app); and the 13.6 pieces of 76 cm stacked beside the water's column (the compare step).
// Procedural, no image files, modest in triangles.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { SURFACE_Y } from './barometer.js';
import { H_HG, segments } from './reading.js';

function canvasTex(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(/** @type {CanvasRenderingContext2D} */ (c.getContext('2d')), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The backdrop: a deep evening blue at the top to a soft lavender-grey low down (screen space). */
export function backdropTexture() {
  return canvasTex(4, 256, (g) => {
    const s = g.createLinearGradient(0, 0, 0, 256);
    s.addColorStop(0, '#2f3b5c');
    s.addColorStop(0.5, '#4a5a80');
    s.addColorStop(0.85, '#7d87a6');
    s.addColorStop(1, '#8f97b1');
    g.fillStyle = s;
    g.fillRect(0, 0, 4, 256);
  });
}

/** Oiled teak planks, seen from above. */
function teak() {
  return canvasTex(
    512,
    512,
    (ctx, W, H) => {
      const r = rng(7);
      ctx.fillStyle = '#b86c33';
      ctx.fillRect(0, 0, W, H);
      for (let p = 0; p < 8; p++) {
        const y0 = (p * H) / 8;
        ctx.fillStyle = `hsl(${22 + r() * 6}, ${48 + r() * 10}%, ${36 + r() * 8}%)`;
        ctx.fillRect(0, y0, W, H / 8);
        for (let i = 0; i < 14; i++) {
          const y = y0 + r() * (H / 8);
          ctx.strokeStyle = `rgba(70,32,10,${0.12 + r() * 0.22})`;
          ctx.lineWidth = 0.6 + r() * 1.6;
          ctx.beginPath();
          for (let x = 0; x <= W; x += 16) {
            const yy = y + Math.sin(x * 0.01 + i) * 2;
            x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
          }
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(40,16,4,0.6)';
        ctx.fillRect(0, y0, W, 2);
      }
    },
    { repeat: [2, 2] },
  );
}

/** Dark stone tiles that fade out (alpha) far away, so the floor melts into the backdrop. */
function stone() {
  return canvasTex(
    256,
    256,
    (ctx, W, H) => {
      const r = rng(5);
      ctx.fillStyle = '#434b66';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.02 + r() * 0.03})` : `rgba(10,14,30,${0.04 + r() * 0.05})`;
        const d = 2 + r() * 7;
        ctx.fillRect(r() * W, r() * H, d, d);
      }
    },
    { repeat: [12, 12] },
  );
}
function fade() {
  const t = canvasTex(256, 256, (ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.12, '#ffffff');
    g.addColorStop(0.45, '#000000');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export const PLATFORM_R = 2.3;

/** The platform and the floor. */
export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Setting';
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(PLATFORM_R, PLATFORM_R + 0.04, 0.12, 72), [
    new THREE.MeshStandardMaterial({ name: 'TeakEdge', color: '#6e3816', roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ name: 'Teak', map: teak(), roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: '#3a2010' }),
  ]);
  deck.position.y = -0.06;
  deck.receiveShadow = true;
  deck.name = 'Platform';
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Floor', map: stone(), alphaMap: fade(), transparent: true, roughness: 0.9, depthWrite: false }),
  );
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  floor.renderOrder = -1;
  root.add(floor, deck);
  return { root, shadowCatchers: [deck] };
}

/** The measuring staff: a cream board from the platform to 11.1 m, its 0 at the liquids' surface. */
export const STAFF = { x: 0.95, width: 0.2, top: 11 };

export function createStaff(num) {
  const root = new THREE.Group();
  root.name = 'Staff';
  const h = SURFACE_Y + STAFF.top + 0.15;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(STAFF.width, h, 0.04),
    new THREE.MeshStandardMaterial({ name: 'StaffPaint', color: '#f3e7cc', roughness: 0.6 }),
  );
  board.position.set(STAFF.x + STAFF.width / 2, h / 2, -0.03);
  board.castShadow = true;
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: '#39404d', roughness: 0.6 }));
  foot.position.set(STAFF.x + STAFF.width / 2, 0.025, -0.03);
  root.add(board, foot);
  const ink = new THREE.MeshBasicMaterial({ color: '#1b1f24', toneMapped: false });
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  // metres and half metres (always), tenths (shown only close up, where they don't blur together)
  const big = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.004), ink, 2 * STAFF.top + 1);
  for (let i = 0; i <= 2 * STAFF.top; i++) {
    const whole = i % 2 === 0;
    const len = whole ? STAFF.width : STAFF.width * 0.55;
    p.set(STAFF.x + len / 2, SURFACE_Y + i / 2, -0.008);
    sc.set(len, whole ? 0.03 : 0.018, 1);
    big.setMatrixAt(i, M.compose(p, q, sc));
  }
  const tenths = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.004), ink, 10 * STAFF.top);
  let n = 0;
  for (let i = 0; i <= 10 * STAFF.top; i++) {
    if (i % 5 === 0) continue;
    p.set(STAFF.x + STAFF.width * 0.15, SURFACE_Y + i / 10, -0.008);
    sc.set(STAFF.width * 0.3, 0.008, 1);
    tenths.setMatrixAt(n++, M.compose(p, q, sc));
  }
  tenths.count = n;
  root.add(big, tenths);
  // the numbers: one per metre, beside the board (the app turns them to the camera and keeps their size on screen)
  const numbers = [];
  for (let m = 0; m <= STAFF.top; m++) {
    const label = textMesh(m === STAFF.top ? `${num(String(m))} m` : num(String(m)), 1, { color: '#ffffff', weight: 700, align: 'left' });
    label.material.depthTest = false;
    label.renderOrder = 20;
    label.position.set(STAFF.x + STAFF.width + 0.06, SURFACE_Y + m, 0);
    label.userData.noExport = true;
    root.add(label);
    numbers.push(label);
  }
  return { root, numbers, tenths };
}

/** The compare step: 13.6 pieces of 76 cm stacked beside the water's column, orange and pale orange in turn. */
export function createStack(x, { width = 0.1, total = segments() } = {}) {
  const root = new THREE.Group();
  root.name = 'Stack76';
  root.userData.noExport = true;
  const n = Math.ceil(total);
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, depthTest: false, transparent: true });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n);
  const edge = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: '#2b1608', toneMapped: false, depthTest: false, transparent: true }),
    n,
  );
  mesh.renderOrder = 23;
  edge.renderOrder = 22;
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const full = total;
  for (let i = 0; i < n; i++) {
    const h = Math.min(1, full - i) * H_HG;
    p.set(x, SURFACE_Y + i * H_HG + h / 2, 0);
    sc.set(width, h - 0.035, width * 0.4);
    mesh.setMatrixAt(i, M.compose(p, q, sc));
    sc.set(width * 1.35, h, width * 0.3);
    edge.setMatrixAt(i, M.compose(p, q, sc));
    mesh.setColorAt(i, c.set(i % 2 ? '#ffc078' : '#f76707'));
  }
  root.add(edge, mesh);
  /** k: 0 … 1, how many pieces show (they stack up from the bottom). */
  function setShown(k) {
    const m = Math.max(0, Math.min(n, Math.ceil(k * full - 1e-6)));
    mesh.count = m;
    edge.count = m;
    root.visible = m > 0;
  }
  return { root, setShown, count: n };
}
