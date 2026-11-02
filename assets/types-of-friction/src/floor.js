// The floor (metres): a railway platform of warm grey cement tiles, 0.5 m square in two shades with dark joints and
// terrazzo chips, so the sliding crate is seen to move when the view follows it. In front, the yellow tactile strip
// and the platform's edge (a cement coping over the drop to the track). Behind, the platform runs to the station wall
// (setting.js). Everything repeats every 2 m along x, so the test's long steady slide, which jumps back 6 m, is
// seamless. A dashed outline shows where the crate started, one mesh.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const FLOOR = { x0: -12, x1: 18, z0: -2.6, z1: 1.9, tile: 0.5, drop: 0.75 };

function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function canvasTexture(w, h, draw, { repeatX = 1, repeatY = 1, anisotropy = 8 } = {}) {
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

/** Cement tiles: one picture is 2 m × 2 m (4 × 4 tiles of 0.5 m), two shades in a chequer, chips and wear. */
function tileTexture(anisotropy) {
  const len = FLOOR.x1 - FLOOR.x0;
  const depth = FLOOR.z1 - FLOOR.z0;
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      const rnd = rng(11);
      const n = 4;
      const s = w / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const base = (i + j) % 2 ? [176, 166, 150] : [154, 145, 131];
          const k = 0.94 + rnd() * 0.1;
          g.fillStyle = `rgb(${base.map((c) => Math.round(c * k)).join(',')})`;
          g.fillRect(i * s, j * s, s, s);
          // a soft worn patch in the tile
          const cx = (i + 0.2 + rnd() * 0.6) * s;
          const cy = (j + 0.2 + rnd() * 0.6) * s;
          const grad = g.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
          grad.addColorStop(0, `rgba(${rnd() < 0.5 ? '200,192,176' : '120,112,100'},0.22)`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.fillRect(i * s, j * s, s, s);
        }
      // terrazzo chips
      for (let i = 0; i < 4500; i++) {
        g.fillStyle = ['#7c7266', '#d6cdbd', '#8e6f55', '#5f5a55', '#c9b89a'][Math.floor(rnd() * 5)];
        g.globalAlpha = 0.35 + rnd() * 0.5;
        const r = 0.8 + rnd() * 1.4;
        g.fillRect(rnd() * w, rnd() * h, r, r);
      }
      g.globalAlpha = 1;
      // the joints, with a light bevel on one side so they read as grooves
      for (let i = 0; i <= n; i++) {
        const p = i * s;
        g.fillStyle = '#5d554b';
        g.fillRect(p - 2, 0, 4, h);
        g.fillRect(0, p - 2, w, 4);
        g.fillStyle = 'rgba(232,224,208,0.35)';
        g.fillRect(p + 2, 0, 1.5, h);
        g.fillRect(0, p + 2, w, 1.5);
      }
    },
    { repeatX: len / 2, repeatY: depth / 2, anisotropy },
  );
}

/** The yellow tactile strip: raised dots on yellow tiles; one picture is 0.6 m along the strip. */
function stripTexture(anisotropy) {
  return canvasTexture(
    256,
    64,
    (g, w, h) => {
      g.fillStyle = '#e6b31e';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < 12; x++)
        for (let y = 0; y < 3; y++) {
          const cx = ((x + 0.5) / 12) * w;
          const cy = ((y + 0.5) / 3) * h;
          const grad = g.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, 7);
          grad.addColorStop(0, '#fbe08a');
          grad.addColorStop(0.6, '#e2ad18');
          grad.addColorStop(1, '#a87a0c');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(cx, cy, 6.5, 0, Math.PI * 2);
          g.fill();
        }
      g.fillStyle = '#9c7a22';
      g.fillRect(0, 0, w, 2);
      g.fillRect(0, h - 2, w, 2);
      for (const x of [0, w / 2]) g.fillRect(x, 0, 2, h);
    },
    { repeatX: (FLOOR.x1 - FLOOR.x0) / 0.6, anisotropy },
  );
}

/** The platform's face over the track: weathered cement with rain streaks; one picture is 3 m along. */
function faceTexture(anisotropy) {
  return canvasTexture(
    256,
    128,
    (g, w, h) => {
      const rnd = rng(5);
      g.fillStyle = '#7d7871';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        const x = rnd() * w;
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(60,54,48,0.35)');
        grad.addColorStop(1, 'rgba(60,54,48,0)');
        g.fillStyle = grad;
        g.fillRect(x, 0, 1 + rnd() * 4, h * (0.4 + rnd() * 0.6));
      }
      for (let i = 0; i < 2500; i++) {
        g.fillStyle = rnd() < 0.5 ? 'rgba(160,154,146,0.5)' : 'rgba(70,66,60,0.5)';
        g.fillRect(rnd() * w, rnd() * h, 1.3, 1.3);
      }
    },
    { repeatX: (FLOOR.x1 - FLOOR.x0) / 3, anisotropy: Math.min(2, anisotropy) },
  );
}

/** The track bed: grey-brown ballast stones; one picture is 1 m square. */
function ballastTexture(anisotropy) {
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      const rnd = rng(23);
      g.fillStyle = '#6d655b';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1000; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 2.5 + rnd() * 5;
        const tone = Math.round(80 + rnd() * 80);
        g.fillStyle = `rgb(${tone + 8},${tone},${tone - 10})`;
        g.beginPath();
        g.ellipse(x, y, r, r * (0.6 + rnd() * 0.4), rnd() * Math.PI, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(30,26,22,0.35)';
        g.fillRect(x - r * 0.2, y + r * 0.5, r, 1);
      }
    },
    { repeatX: (FLOOR.x1 - FLOOR.x0) / 1, repeatY: 5, anisotropy: Math.min(4, anisotropy) },
  );
}

export function createFloor({ anisotropy = 8 } = {}) {
  const root = new THREE.Group();
  root.name = 'Floor';
  const len = FLOOR.x1 - FLOOR.x0;
  const depth = FLOOR.z1 - FLOOR.z0;
  const cx = (FLOOR.x0 + FLOOR.x1) / 2;

  // the platform's top: the only thing in the figure that shows a shadow
  const top = new THREE.MeshStandardMaterial({ name: 'PlatformTiles', map: tileTexture(anisotropy), roughness: 0.82, metalness: 0 });
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(len, depth).rotateX(-Math.PI / 2), top);
  slab.position.set(cx, 0, (FLOOR.z0 + FLOOR.z1) / 2);
  slab.name = 'FloorSlab';
  slab.receiveShadow = true;
  root.add(slab);

  // the yellow tactile strip near the edge (raised a hair, so it never flickers with the tiles)
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 0.3).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'TactileStrip', map: stripTexture(anisotropy), roughness: 0.7, metalness: 0 }),
  );
  strip.position.set(cx, 0.002, FLOOR.z1 - 0.38);
  strip.name = 'TactileStrip';
  root.add(strip);

  // the edge: a pale coping that overhangs a little, the face below it down to the track bed
  const faceMat = new THREE.MeshStandardMaterial({ name: 'PlatformFace', map: faceTexture(anisotropy), roughness: 0.92, metalness: 0 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(len, FLOOR.drop), faceMat);
  face.position.set(cx, -FLOOR.drop / 2 - 0.07, FLOOR.z1 - 0.02);
  face.name = 'PlatformFace';
  root.add(face);
  const coping = new THREE.Mesh(
    mergeGeometries([
      new THREE.BoxGeometry(len, 0.07, 0.12).translate(0, -0.035, 0),
      new THREE.BoxGeometry(len, 0.012, 0.04).translate(0, -0.075, -0.03),
    ]),
    new THREE.MeshStandardMaterial({ name: 'Coping', color: '#c9c0b0', roughness: 0.85, metalness: 0 }),
  );
  coping.position.set(cx, 0, FLOOR.z1 + 0.04);
  coping.name = 'Coping';
  root.add(coping);

  // below the edge, the track: ballast, concrete sleepers every 0.6 m and two steel rails (seen in the turned view)
  const bedY = -FLOOR.drop - 0.07;
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 5).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Ballast', map: ballastTexture(anisotropy), roughness: 1, metalness: 0 }),
  );
  bed.position.set(cx, bedY, FLOOR.z1 + 2.5);
  bed.name = 'TrackBed';
  root.add(bed);
  const track = [];
  const tz = FLOOR.z1 + 1.55; // the track's middle
  for (let x = FLOOR.x0 + 0.3; x < FLOOR.x1; x += 0.6) track.push(new THREE.BoxGeometry(0.24, 0.12, 2.5).translate(x, bedY + 0.05, tz));
  const sleepers = mergeGeometries(track);
  for (const g of track) g.dispose();
  const rails = mergeGeometries(
    [-0.84, 0.84].flatMap((dz) => [
      new THREE.BoxGeometry(len, 0.1, 0.07).translate(cx, bedY + 0.16, tz + dz),
      new THREE.BoxGeometry(len, 0.03, 0.14).translate(cx, bedY + 0.125, tz + dz),
    ]),
  );
  root.add(
    Object.assign(new THREE.Mesh(sleepers, new THREE.MeshStandardMaterial({ name: 'Sleepers', color: '#8f897f', roughness: 0.95, metalness: 0 })), {
      name: 'Sleepers',
    }),
    Object.assign(new THREE.Mesh(rails, new THREE.MeshStandardMaterial({ name: 'Rails', color: '#6c6660', roughness: 0.45, metalness: 0.7 })), {
      name: 'Rails',
    }),
  );

  // where the crate started: a thin dashed outline on the floor, dark on the light tiles; one mesh
  const dashMat = new THREE.MeshBasicMaterial({ name: 'StartOutline', color: '#24313f', toneMapped: false });
  const start = new THREE.Mesh(new THREE.BufferGeometry(), dashMat);
  start.name = 'StartOutline';
  start.userData.noExport = true;
  start.visible = false;
  root.add(start);

  return {
    root,
    slab,
    /** Draw the outline of a footprint L × D (metres) centred on x. */
    setStart(x, L, D) {
      const w = 0.012;
      const dash = 0.05;
      const gap = 0.035;
      const parts = [];
      const line = (x0, z0, lenA, alongX) => {
        for (let d = 0; d < lenA; d += dash + gap) {
          const l = Math.min(dash, lenA - d);
          parts.push(
            new THREE.BoxGeometry(alongX ? l : w, 0.001, alongX ? w : l).translate(
              alongX ? x0 + d + l / 2 : x0,
              0.0035,
              alongX ? z0 : z0 + d + l / 2,
            ),
          );
        }
      };
      line(x - L / 2, D / 2, L, true);
      line(x - L / 2, -D / 2, L, true);
      line(x - L / 2, -D / 2, D, false);
      line(x + L / 2, -D / 2, D, false);
      start.geometry.dispose();
      start.geometry = mergeGeometries(parts);
      for (const p of parts) p.dispose();
    },
    showStart(on) {
      start.visible = on;
    },
  };
}
