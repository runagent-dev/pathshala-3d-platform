// The light and what shows behind the floor: a calm deep-blue backdrop (one small gradient, the same family as
// equations-of-motion), a white key light and a cool sky/ground fill. A capture paints the backdrop too (it is the
// scene's background), unless asked for no background (null) or another colour.
import * as THREE from 'three';
/** The backdrop, top to bottom (CSS colours). */
export const BACKDROP = ['#0b2a5b', '#123d7a', '#1d5291'];
export function createPresentation(stage, transparent, shadows = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 128;
  const ctx = canvas.getContext('2d'),
    g = ctx.createLinearGradient(0, 0, 0, 128);
  BACKDROP.forEach((c, i) => g.addColorStop(i / (BACKDROP.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  stage.scene.background = transparent ? null : texture;
  // the key light; without shadows (shadow=0) it carries the sun's share too
  const key = new THREE.DirectionalLight(0xffffff, transparent || !shadows ? 1.35 : 0.45);
  key.position.set(-3, 5, 7);
  stage.scene.add(key, new THREE.HemisphereLight(0xeef4ff, 0x4a6488, 0.75));
  return {
    /** As the stage's capture, on the backdrop (background: null for none, or a CSS colour other than white). */
    capture(options = {}) {
      const before = stage.scene.background;
      const bg = options.background;
      const own = bg === undefined || bg === 'theme' || bg === '#ffffff';
      if (!own) stage.scene.background = null;
      try {
        return stage.capture({ ...options, background: own ? '#ffffff' : bg });
      } finally {
        stage.scene.background = before;
        stage.invalidate();
      }
    },
  };
}
