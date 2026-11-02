// The reactor pool's water behind the nuclei: a soft muted blue, painted once on a small canvas.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The pool's water, the background of the nuclei. */
export function poolBackground() {
  const W = 512;
  const H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  // calm water: a soft muted blue, lighter at the top (the red and grey nucleons, the white "+" and the warm glow of
  // the split all stand out on it); no rods, rays or ripples to compete with the nuclei
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#8db1cc');
  lg.addColorStop(0.5, '#5f88ab');
  lg.addColorStop(1, '#3f6688');
  g.fillStyle = lg;
  g.fillRect(0, 0, W, H);
  // a soft vignette: the middle (where the nuclei are) a little lighter, the corners deeper
  const v = g.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H * 0.45, W * 0.75);
  v.addColorStop(0, 'rgba(200,225,240,0.12)');
  v.addColorStop(1, 'rgba(20,40,70,0.22)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return tex(c);
}
