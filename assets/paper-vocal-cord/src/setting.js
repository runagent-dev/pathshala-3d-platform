// The setting: a calm backdrop (screen space), soft blue-grey at the top to a pale warm stone below, with a light glow
// behind the paper, so the white paper, the black clip and the teal air all read on it. No floor and no props.
import * as THREE from 'three';

export function backdropTexture() {
  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const lin = g.createLinearGradient(0, 0, 0, H);
  lin.addColorStop(0, '#7f93ab');
  lin.addColorStop(0.5, '#a9b6c4');
  lin.addColorStop(1, '#d8cfc2');
  g.fillStyle = lin;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.42, H * 0.45, 4, W * 0.42, H * 0.45, W * 0.62);
  glow.addColorStop(0, 'rgba(236,242,248,0.35)');
  glow.addColorStop(1, 'rgba(236,242,248,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The bench the clip stands on: a pale warm grey top with a fine, non-repeating grain (one 512 px texture over the
 * whole disc), fading out at its rim into the backdrop. Receives the shadows.
 */
export function createBench(y) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = '#cfc6b8';
  g.fillRect(0, 0, S, S);
  let seed = 7;
  const r = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,250,240,${0.05 + 0.08 * r()})` : `rgba(90,78,62,${0.04 + 0.06 * r()})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  // the rim: opaque in the middle, fading out to nothing
  const a = document.createElement('canvas');
  a.width = a.height = 256;
  const ga = /** @type {CanvasRenderingContext2D} */ (a.getContext('2d'));
  const grad = ga.createRadialGradient(128, 128, 30, 128, 128, 128);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.35, '#fff');
  grad.addColorStop(1, '#000');
  ga.fillStyle = grad;
  ga.fillRect(0, 0, 256, 256);
  const alphaMap = new THREE.CanvasTexture(a);
  const bench = new THREE.Mesh(
    new THREE.CircleGeometry(46, 64),
    new THREE.MeshStandardMaterial({ name: 'Bench', map, alphaMap, transparent: true, roughness: 0.85, metalness: 0, depthWrite: false }),
  );
  bench.name = 'Bench';
  bench.rotation.x = -Math.PI / 2;
  bench.position.y = y;
  bench.receiveShadow = true;
  bench.userData.noExport = true;
  return bench;
}
