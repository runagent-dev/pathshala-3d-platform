import * as THREE from 'three';
export function createPresentation(stage, transparent) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#12375f');
  gradient.addColorStop(0.6, '#176e87');
  gradient.addColorStop(1, '#19978d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 512);
  const background = new THREE.CanvasTexture(canvas);
  background.colorSpace = THREE.SRGBColorSpace;
  const key = new THREE.DirectionalLight(0xffe4c4, 0.8);
  key.position.set(-150, 280, 300);
  stage.scene.add(key);
  return {
    setScene(scene) {
      key.visible = scene === 'comb';
      stage.scene.background = !transparent && scene === 'comb' ? background : null;
      stage.invalidate();
    },
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
