// Where the clock is: on a blue plastered wall. None of it is exported (noExport) and none of it is drawn on a
// transparent background. One small plaster canvas (512 px), repeated.
import * as THREE from 'three';

function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

let plasterBase = null;
/**
 * A seamless plaster grain (light, so a material's colour tints it): soft trowel blotches (two octaves of tiling
 * value noise) and fine grit, computed straight into a pixel array (a few milliseconds, and no 2D canvas: drawing
 * it on one held a slow phone up for seconds).
 */
function plasterPixels() {
  const N = 512;
  const d = new Uint8Array(N * N * 4);
  const r = rand(11);
  const octave = (cells) => {
    const v = new Float32Array(cells * cells).map(() => r());
    return (x, y) => {
      const fx = (x / N) * cells;
      const fy = (y / N) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const sx = fx - x0;
      const sy = fy - y0;
      const ux = sx * sx * (3 - 2 * sx);
      const uy = sy * sy * (3 - 2 * sy);
      const at = (i, j) => v[(j % cells) * cells + (i % cells)];
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * ux;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * ux;
      return top + (bottom - top) * uy;
    };
  };
  const broad = octave(6);
  const fine = octave(24);
  for (let y = 0, i = 0; y < N; y++)
    for (let x = 0; x < N; x++, i += 4) {
      const n = 240 + (broad(x, y) - 0.5) * 12 + (fine(x, y) - 0.5) * 12 + (r() - 0.5) * 24;
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, n));
      d[i + 3] = 255;
    }
  return { data: d, size: N };
}

/**
 * The plaster grain repeated so that one tile covers `tile` cm of a surface `w` × `h` cm. Every copy shares one
 * image (a clone keeps the source), so the grain is made and uploaded once.
 */
function plaster(w, h, tile = 150) {
  if (!plasterBase) {
    const { data, size } = plasterPixels();
    plasterBase = new THREE.DataTexture(data, size, size);
    plasterBase.colorSpace = THREE.SRGBColorSpace;
    plasterBase.magFilter = THREE.LinearFilter;
    plasterBase.minFilter = THREE.LinearMipmapLinearFilter;
    plasterBase.generateMipmaps = true;
    plasterBase.needsUpdate = true;
    plasterBase.wrapS = plasterBase.wrapT = THREE.RepeatWrapping;
    plasterBase.anisotropy = 1;
  }
  const t = plasterBase.clone();
  t.repeat.set(w / tile, h / tile);
  return t;
}

/** The clock's wall: blue plaster, a little lighter towards the lamp (upper left) and darker at the far edges. */
export function createWall({ z }) {
  const W = 420;
  const H = 320;
  const geo = new THREE.PlaneGeometry(W, H, 12, 10);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const lit = 1.06 - Math.hypot(pos.getX(i) + 40, pos.getY(i) - 50) / 420; // brighter round the lamp's side
    colors.set([lit, lit, lit], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const wall = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ name: 'Wall', color: 0x86a6c4, map: plaster(W, H, 110), vertexColors: true, roughness: 0.95 }),
  );
  wall.name = 'Wall';
  wall.position.set(0, -20, z);
  wall.receiveShadow = true; // the clock's soft shadow
  wall.userData.noExport = true;
  return wall;
}

/** A vertical gradient for the scene's background: what shows past the room, or the night sky's depth. */
export function gradientTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
