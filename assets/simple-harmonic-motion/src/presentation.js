// Saturated studio colours separate the moving object from the fixed support. No external textures or images.
import * as THREE from 'three';
export function createPresentation(stage, transparent) {
  const backgrounds = {};
  for (const [example, colours] of Object.entries({ swing: ['#163650', '#12616c', '#207357'], spring: ['#21184f', '#493273', '#863e70'] })) {
    if (transparent) break;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, colours[0]);
    gradient.addColorStop(0.62, colours[1]);
    gradient.addColorStop(1, colours[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    backgrounds[example] = texture;
  }
  const fill = new THREE.HemisphereLight(0xe4f6ff, 0x6c9a66, 1);
  const key = new THREE.DirectionalLight(0xffedd0, 1.5);
  key.position.set(-3, 5, 5);
  stage.scene.add(fill, key);
  return {
    setExample(example) {
      if (!transparent) stage.scene.background = backgrounds[example];
      stage.invalidate();
    },
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
