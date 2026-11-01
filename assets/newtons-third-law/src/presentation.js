// The two backgrounds: for the boat, the river ghat's own sky dome (src/setting.js) over a haze colour; for the apple,
// deep space, navy at the top to a lighter blue, with a faint band of the Milky Way across it (the stars themselves
// are points in the scene, src/earth.js). Lights shared by both.
import * as THREE from 'three';

function spaceTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#060f24');
  grad.addColorStop(0.55, '#0f2c52');
  grad.addColorStop(1, '#173f6c');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  // a soft diagonal band of the Milky Way
  g.save();
  g.translate(128, 230);
  g.rotate(-0.5);
  const band = g.createLinearGradient(0, -70, 0, 70);
  band.addColorStop(0, 'rgba(120,150,210,0)');
  band.addColorStop(0.5, 'rgba(150,175,230,0.16)');
  band.addColorStop(1, 'rgba(120,150,210,0)');
  g.fillStyle = band;
  g.fillRect(-400, -70, 800, 140);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * @param {ReturnType<import('@shared/stage.js').createStage>} stage
 * @param {boolean} transparent the page's own background shows (no sky, no space)
 * @param {THREE.Object3D[]} skies objects that are only background (hidden when transparent)
 */
export function createPresentation(stage, transparent, skies = []) {
  const backgrounds = { boat: new THREE.Color('#efd6aa'), apple: spaceTexture() };
  for (const o of skies) o.visible = !transparent;
  const key = new THREE.DirectionalLight(0xffebcd, 2.2);
  key.position.set(-3, 5, 7);
  const fill = new THREE.HemisphereLight(0xd8efff, 0x384355, 0.8);
  stage.scene.add(key, fill);
  return {
    key,
    fill,
    set(example) {
      stage.scene.background = transparent ? null : backgrounds[example];
      stage.invalidate();
    },
    capture(options = {}) {
      const before = stage.scene.background;
      const shown = skies.map((o) => o.visible);
      if (options.background !== undefined) {
        stage.scene.background = null;
        for (const o of skies) o.visible = false;
      }
      try {
        return stage.capture(options);
      } finally {
        stage.scene.background = before;
        skies.forEach((o, i) => (o.visible = shown[i]));
        stage.invalidate();
      }
    },
  };
}
