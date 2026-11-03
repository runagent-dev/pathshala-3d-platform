// The setting: a soft warm backdrop (screen space), apricot at the top to a deeper terracotta below, with a light glow
// behind the paper, so the white paper, the brown skin and the teal air all read on it. No floor and no props: the
// paper is held up in the air, as a student holds it at the lips.
import * as THREE from 'three';

export function backdropTexture() {
  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  const lin = g.createLinearGradient(0, 0, 0, H);
  lin.addColorStop(0, '#d6a67e');
  lin.addColorStop(0.55, '#c3875f');
  lin.addColorStop(1, '#8f5238');
  g.fillStyle = lin;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.42, H * 0.45, 4, W * 0.42, H * 0.45, W * 0.62);
  glow.addColorStop(0, 'rgba(255,226,196,0.35)');
  glow.addColorStop(1, 'rgba(255,236,214,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
