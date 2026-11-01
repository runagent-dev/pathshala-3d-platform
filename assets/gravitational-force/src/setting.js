// Where each stop happens: the two apples on a plain table before a soft blue backdrop and a warm floor, and the Earth, the Moon, the Sun and the galaxy in a night sky of stars, thick
// along a Milky Way band, with a soft blue atmosphere round the Earth. None of it is exported (noExport, sprites and
// shader materials are left out) and none of it is drawn on a transparent background.
// Cheap on purpose: the setting is two planes, the table two meshes; the stars two point clouds.
import * as THREE from 'three';
import { bakeParts } from './draw.js';

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function canvasTexture(c, repeat = null) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** A vertical gradient for the scene's background: the night sky's depth, or what shows past the room. */
export function gradientTexture(top, bottom) {
  const c = canvas(4, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  return canvasTexture(c);
}

export const TABLE = { w: 150, d: 52, top: 3.5, h: 75, cx: 2 }; // cm; the top's upper face is at y = 0

/**
 * The table the apples lie on: its top (the only part that shows the apples' shadows) and its legs and apron (one
 * mesh), in centimetres.
 */
export function createTableModel() {
  const wood = new THREE.MeshStandardMaterial({ name: 'TableWood', color: '#c68a55', roughness: 0.7, metalness: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w, TABLE.top, TABLE.d), wood);
  top.name = 'TableTop';
  top.position.set(TABLE.cx, -TABLE.top / 2, 0);
  const parts = [];
  const legH = TABLE.h - TABLE.top;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(5, legH, 5));
      leg.position.set(TABLE.cx + sx * (TABLE.w / 2 - 6), -TABLE.top - legH / 2, sz * (TABLE.d / 2 - 6));
      parts.push({ mesh: leg, color: '#7a4a2a' });
    }
  for (const sz of [-1, 1]) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w - 14, 9, 2.4));
    apron.position.set(TABLE.cx, -TABLE.top - 4.5, sz * (TABLE.d / 2 - 5));
    parts.push({ mesh: apron, color: '#6e4224' });
  }
  for (const sx of [-1, 1]) {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(2.4, 9, TABLE.d - 14));
    apron.position.set(TABLE.cx + sx * (TABLE.w / 2 - 5), -TABLE.top - 4.5, 0);
    parts.push({ mesh: apron, color: '#6e4224' });
  }
  const frame = new THREE.Mesh(bakeParts(parts), new THREE.MeshStandardMaterial({ name: 'TableFrame', vertexColors: true, roughness: 0.7 }));
  frame.name = 'TableFrame';
  return { top, frame };
}

/**
 * The setting round the table: a plain warm floor and a soft blue backdrop (two planes, no textures), so only the
 * apples and the table draw the eye.
 */
export function createRoom() {
  const root = new THREE.Group();
  root.name = 'Room';
  root.userData.noExport = true;
  const floorY = -TABLE.h;
  const backZ = -78; // the backdrop, a little behind the table
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 500),
    new THREE.MeshStandardMaterial({ name: 'Floor', color: '#b0806a', roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, floorY, backZ + 250);
  floor.name = 'Floor';
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 320),
    new THREE.MeshBasicMaterial({ name: 'Backdrop', map: gradientTexture('#7fa3c4', '#b5cde0'), toneMapped: false }),
  );
  back.position.set(0, floorY + 160, backZ);
  back.name = 'Backdrop';
  root.add(floor, back);
  return root;
}

/** The night sky: dim stars thick along a Milky Way band, and a few bright ones (two point clouds, far away). */
export function createStars() {
  const root = new THREE.Group();
  root.name = 'Stars';
  root.userData.noExport = true;
  const dot = canvas(32, 32);
  const g = dot.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(dot);
  const r = rand(23);
  const band = new THREE.Vector3(0.35, 0.8, -0.48).normalize(); // the band's pole
  const v = new THREE.Vector3();
  const tints = [
    [1, 1, 1],
    [0.78, 0.86, 1],
    [1, 0.9, 0.74],
  ];
  function cloud(count, size, bright, inBand) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      do {
        v.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
      } while (v.lengthSq() > 1 || v.lengthSq() < 0.01);
      v.normalize();
      if (r() < inBand) v.addScaledVector(band, -v.dot(band) * (0.75 + r() * 0.25)).normalize();
      pos.set([v.x * 3000, v.y * 3000, v.z * 3000], i * 3);
      const t = tints[Math.floor(r() * tints.length)];
      const k = bright * (0.45 + r() * 0.55);
      col.set([t[0] * k, t[1] * k, t[2] * k], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size, map, vertexColors: true, sizeAttenuation: false, transparent: true, depthWrite: false, toneMapped: false }),
    );
    pts.frustumCulled = false;
    pts.renderOrder = -1;
    return pts;
  }
  root.add(cloud(1800, 3, 0.8, 0.55), cloud(170, 5.2, 1, 0.2));
  return root;
}

/**
 * A soft blue atmosphere round a planet of radius r: a slightly larger sphere seen from inside, brightest at the
 * planet's edge and fading outwards (additive, a shader: never exported).
 */
export function createHalo(r, color = '#5fa8ff', strength = 0.9) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color).multiplyScalar(strength) } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      varying vec3 vN;
      void main() {
        float k = clamp(-vN.z / 0.42, 0.0, 1.0);
        gl_FragColor = vec4(color * k * k, 1.0);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 48, 24), mat);
  halo.name = 'Atmosphere';
  halo.userData.noExport = true;
  halo.renderOrder = 2;
  return halo;
}
