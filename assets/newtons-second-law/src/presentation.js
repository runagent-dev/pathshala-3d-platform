import * as THREE from 'three';
export function createPresentation(stage, transparent) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 512;
  const ctx = canvas.getContext('2d'),
    g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#102b58');
  g.addColorStop(1, '#176977');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  stage.scene.background = transparent ? null : texture;
  const key = new THREE.DirectionalLight(0xffedce, 1.5);
  key.position.set(-3, 5, 7);
  stage.scene.add(key, new THREE.HemisphereLight(0xc4f4ff, 0x224d56, 0.7));
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
