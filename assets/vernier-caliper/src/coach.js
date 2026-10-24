// The caliper's first-use pointers (shared engine: @shared/student/coach.js). The hand goes on the sliding
// jaw, at a spot a finger really grabs (checked by raycasting), and the demo slides the jaw a little.
import * as THREE from 'three';
import { createCoach as createStudentCoach } from '@shared/student/coach.js';
import { DIM } from './caliper.js';

// Spots on the slider, in its own millimetres: along the top bar, then the vernier plate.
const JAW_SPOTS = [44, 50, 38, 56, 32, 26].map((x) => [x, 21]).concat([44, 50, 30].map((x) => [x, 1.5]));

export function createCoach({ stage, layer, t, s, caliper, loupe, pick, animateGap, tweener, avoid = [] }) {
  const v = new THREE.Vector3();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  return createStudentCoach({
    stage,
    layer,
    t,
    loupe,
    tweener,
    avoid,
    object: {
      label: 'coach_jaw',
      candidates: () =>
        JAW_SPOTS.map(([lx, ly]) => {
          caliper.slider.localToWorld(v.set(lx, ly, DIM.plateZ));
          v.project(stage.camera);
          return v.z > -1 && v.z < 1 ? { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height } : null;
        }),
      grabbable: (p) => {
        const hit = pick(p);
        return hit?.kind === 'slider' && !hit.viaLens;
      },
      // Slide the jaw a few millimetres and back, twice.
      async demo(alive) {
        for (let i = 0; i < 2; i++) {
          if (!alive() || s.dragging || s.locked || s.specimen) return;
          const g0 = s.gap;
          const to = g0 + 4 <= DIM.maxGap ? g0 + 4 : g0 - 4;
          if (!(await animateGap(to, 0.75))) return;
          await wait(250);
          if (!alive()) return;
          if (!(await animateGap(g0, 0.6))) return;
          await wait(500);
        }
      },
      cancel: () => tweener.cancel('gap'),
    },
  });
}
