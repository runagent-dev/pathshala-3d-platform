// The setting of each example (src/scenery.js: a village courtyard for the swing, a laboratory bench for the spring),
// its sky or room behind, and the lights. With bg=transparent there is no setting, only the lights.
import * as THREE from 'three';
import { createCourtyard, createLab } from './scenery.js';

export function createPresentation(stage, transparent) {
  const makers = { swing: createCourtyard, spring: createLab };
  /** @type {Record<string, { root: THREE.Object3D, background: THREE.Texture | null }>} */
  const sets = {}; // each setting is made the first time its example is shown
  // a sun high on the left (it casts the shadows) and a soft sky above the clay; the stage's studio reflections are
  // turned down (createStage, environmentIntensity) so the shadows read
  const fill = new THREE.HemisphereLight(0xdcefff, 0x8a6a4c, 0.6);
  const key = new THREE.DirectionalLight(0xfff0d8, 2.7);
  key.position.set(-2.5, 7, 4);
  stage.scene.add(fill, key);
  return {
    key,
    setExample(example) {
      if (!transparent && !sets[example] && makers[example]) {
        sets[example] = makers[example]();
        stage.scene.add(sets[example].root);
      }
      for (const [name, set] of Object.entries(sets)) set.root.visible = name === example;
      if (sets[example]) stage.scene.background = sets[example].background;
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
