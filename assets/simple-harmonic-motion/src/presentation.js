// Saturated studio colours separate the moving object from the fixed support. No external textures or images.
import * as THREE from 'three';
export function createPresentation(stage, transparent) {
  if (!transparent) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#163650');
    gradient.addColorStop(0.62, '#12616c');
    gradient.addColorStop(1, '#207357');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    stage.scene.background = texture;
  }
  const fill = new THREE.HemisphereLight(0xe4f6ff, 0x6c9a66, 1);
  const key = new THREE.DirectionalLight(0xffedd0, 1.5);
  key.position.set(-3, 5, 5);
  stage.scene.add(fill, key);
  return {
    capture(options = {}) {
      const background = stage.scene.background;
      if (options.background !== undefined) stage.scene.background = null;
      try {
        return stage.capture(options);
      } finally {
        stage.scene.background = background;
        stage.invalidate();
      }
    },
  };
}
