import * as THREE from 'three';
export function createPresentation(stage, transparent) {
  const textures = {};
  for (const [key, colours] of Object.entries({ boat: ['#123e70', '#2385a8', '#28b9c3'], apple: ['#071429', '#123761', '#164b77'] })) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    colours.forEach((colour, i) => grad.addColorStop(i / 2, colour));
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures[key] = t;
  }
  const key = new THREE.DirectionalLight(0xffebcd, 2.2);
  key.position.set(-3, 5, 7);
  const fill = new THREE.HemisphereLight(0xd8efff, 0x384355, 0.8);
  stage.scene.add(key, fill);
  return {
    set(example) {
      stage.scene.background = transparent ? null : textures[example];
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
