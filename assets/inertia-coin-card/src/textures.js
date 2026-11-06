// The two small canvas pictures (made here, once, no image files): the deep-blue backdrop and a ruled index card.
// Each is 256 px or smaller and drawn the same on every load.
import * as THREE from 'three';

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** The colours of the backdrop, top and bottom (the same calm deep blue as equations-of-motion). */
export const BG = ['#0b2a5b', '#123d7a'];

/**
 * The backdrop: a vertical gradient, lighter at the bottom, on a 4 × 256 canvas. Used as the scene's background it
 * fills the screen from every angle, with no edges or corners.
 */
export function backdropTexture() {
  const tex = canvas(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, BG[0]);
    grad.addColorStop(1, BG[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** A ruled index card: white stock, a red header line and pale blue rules (one card, no repeat). */
export function cardTexture() {
  const tex = canvas(256, 168, (g, w, h) => {
    g.fillStyle = '#fbfaf5';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70, 120, 200, 0.55)';
    g.lineWidth = 1.5;
    for (let y = 52; y < h - 6; y += 18) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.strokeStyle = 'rgba(210, 60, 60, 0.75)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 34);
    g.lineTo(w, 34);
    g.stroke();
    g.strokeStyle = 'rgba(90, 90, 80, 0.35)';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
