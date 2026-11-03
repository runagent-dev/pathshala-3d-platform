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
