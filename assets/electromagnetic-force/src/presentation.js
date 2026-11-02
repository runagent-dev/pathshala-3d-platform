// The look round the experiment: the study room (src/room.js) behind both examples, a warm key light for the comb
// example, and pictures (capture) with or without the room. With bg=transparent there is no room and no background.
import * as THREE from 'three';
import { createRoom } from './room.js';

export function createPresentation(stage, transparent) {
  const room = transparent ? null : createRoom();
  if (room) stage.scene.add(room);
  // behind the room (only ever seen at the edges of a turned view): the wall's own warm cream
  const background = transparent ? null : new THREE.Color('#cdb184');
  stage.scene.background = background;
  const key = new THREE.DirectionalLight(0xffe4c4, 0.8);
  key.position.set(-150, 280, 300);
  stage.scene.add(key);
  return {
    room,
    setScene(scene) {
      key.visible = scene === 'comb';
      stage.invalidate();
    },
    capture(options = {}) {
      const plain = options.background !== undefined; // a picture on a given background: the experiment alone
      if (plain) {
        stage.scene.background = null;
        if (room) room.visible = false;
      }
      try {
        return stage.capture(options);
      } finally {
        stage.scene.background = background;
        if (room) room.visible = true;
        stage.invalidate();
      }
    },
  };
}
