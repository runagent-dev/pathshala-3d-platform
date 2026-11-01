// The light of the godown and what shows behind it: warm daylight from the high windows (a key light and a warm
// sky/ground fill), and behind the open side of the room (seen only when the view is turned) the dim warm inside of
// the building.
import * as THREE from 'three';
export function createPresentation(stage, transparent, shadows = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d'),
    g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#4a3f37');
  g.addColorStop(0.55, '#7a6652');
  g.addColorStop(1, '#5c5046');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  stage.scene.background = transparent ? null : texture;
  // the key light; without shadows (shadow=0) it carries the sun's share too
  const key = new THREE.DirectionalLight(0xfff0d8, transparent || !shadows ? 1.35 : 0.45);
  key.position.set(-3, 5, 7);
  stage.scene.add(key, new THREE.HemisphereLight(0xfff3e0, 0x6e5c49, 0.7));
  return {
    capture(options = {}) {
      const before = stage.scene.background;
      if (options.background !== undefined) stage.scene.background = null;
      try {
        return stage.capture(options);
      } finally {
        stage.scene.background = before;
        stage.invalidate();
      }
    },
  };
}
