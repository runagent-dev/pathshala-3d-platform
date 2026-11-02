// What happens when the student adds the ice, the cold water or the iron: one pure function of (example, k) with k from
// 0 (before) to 1 (everything mixed), so a jump, a replay and a picture all show exactly the same thing. It moves the
// parts that src/scene.js built (no new geometry) and writes the beaker's temperature on the thermometer's screen.
import * as THREE from 'three';
import { EXAMPLES, litresAt, pieceTempAt, solve, tempAt, tempText } from './reading.js';
import { BEAKER, ICE, IRON, MUG, STATION_X, waterColor } from './scene.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (k, a, b) => clamp01((k - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, x) => a + (b - a) * x;

/** Water's surface height (cm above the bench) for `litres`. */
export const surfaceAt = (litres) => BEAKER.wall + 0.4 + litres * BEAKER.perLitre;

const POUR = { x: -4.6, y: 16.8 }; // the mug's lip over the water
const ABOVE = { x: -1.5, y: 19.2 }; // where the ice and the iron are let go
const MUG_REST = { x: STATION_X + MUG.R + 0.4, y: MUG.H };

/**
 * @param {ReturnType<typeof import('./scene.js').createBench>} bench
 * @param {(x: string | number) => string} N digits for the screen
 */
export function createChoreo(bench, N) {
  const { ice, iron, ironMat, glow, mugGroup, mugWater, stream, bubbles, water, waterMat, saucer, tile, setScreen } = bench;
  mugWater.rotation.order = 'ZXY'; // the water in the mug stays level when the mug tips
  const color = new THREE.Color();
  const cold = new THREE.Color();
  const dummy = new THREE.Object3D();

  /** Show only what this example uses. */
  function showFor(id) {
    ice.visible = id === 'ice';
    saucer.visible = id === 'ice';
    iron.visible = id === 'iron';
    tile.visible = id === 'iron';
    mugGroup.visible = id === 'water';
    if (id === 'water') {
      waterColor(EXAMPLES.water.cold.T0, cold);
      stream.material.color.copy(cold);
      mugWater.material.color.copy(cold);
    }
    if (id !== 'water') stream.visible = false;
    if (id !== 'iron') bubbles.visible = false;
  }

  /** What is going on, for the figure's labels and panel: where the added thing is, and whether it has been added. */
  const out = { T: 0, litres: 1, u: 0, pieceT: null, added: false, mixing: false, done: false, pouring: false };

  function apply(id, k) {
    const ex = EXAMPLES[id];
    showFor(id);
    k = clamp01(k);
    let u = 0;
    let added = false;

    if (id === 'ice') {
      u = seg(k, 0.38, 1);
      const L = litresAt(ex, u);
      const surface = surfaceAt(L);
      const lift = seg(k, 0, 0.25);
      const drop = seg(k, 0.25, 0.38);
      const side = ICE.side;
      const sc = Math.cbrt(Math.max(0, 1 - u));
      if (k < 0.25) {
        const e = smooth(lift);
        ice.position.set(lerp(STATION_X, ABOVE.x, e), lerp(0.7 + side / 2, ABOVE.y, e) + 3 * Math.sin(Math.PI * lift), 0);
        ice.rotation.set(0.3 * Math.sin(Math.PI * lift), 0.4 * e, 0.25 * Math.sin(Math.PI * lift));
      } else if (k < 0.38) {
        const floatY = Math.max(surfaceAt(ex.litres) - 0.4 * side, BEAKER.wall + 0.4 + side / 2);
        ice.position.set(ABOVE.x, lerp(ABOVE.y, floatY, drop * drop), 0);
        ice.rotation.set(0, 0.4, 0);
      } else {
        ice.position.set(ABOVE.x, Math.max(surface - 0.4 * side * sc, BEAKER.wall + 0.4 + (side * sc) / 2), 0);
        ice.rotation.set(0, 0.4, 0);
      }
      ice.scale.setScalar(Math.max(sc, 0.0001));
      ice.visible = sc > 0.02;
      added = k >= 0.38;
    } else if (id === 'iron') {
      u = seg(k, 0.4, 1);
      const surface = surfaceAt(ex.litres);
      const yBottom = BEAKER.wall + 0.4 + IRON.h / 2 + 0.03;
      const lift = seg(k, 0, 0.25);
      const drop = seg(k, 0.25, 0.4);
      if (k < 0.25) {
        const e = smooth(lift);
        iron.position.set(lerp(STATION_X, ABOVE.x, e), lerp(0.9 + IRON.h / 2, ABOVE.y, e) + 3 * Math.sin(Math.PI * lift), 0);
      } else {
        iron.position.set(ABOVE.x, lerp(ABOVE.y, yBottom, drop ** 1.6), 0);
      }
      iron.rotation.set(k < 0.4 ? 0.2 * k * 10 : 0.8, 0, k < 0.4 ? 0.3 : 0.3);
      // it cools as the water warms: glow and glowing edge fade with its temperature
      const T = solve(ex).T;
      const pt = pieceTempAt(ex, u);
      const heat = clamp01((pt - T) / (ex.hot.T0 - T));
      const underwater = iron.position.y < surface ? 0.55 : 1;
      ironMat.emissiveIntensity = 1.6 * heat * heat;
      glow.material.opacity = 0.95 * heat * underwater;
      // bubbles rise while it is hot
      const on = u > 0 && u < 0.6;
      bubbles.visible = on;
      if (on) {
        const fade = Math.min(1, u * 8) * (1 - smooth(seg(u, 0.4, 0.6)));
        for (let i = 0; i < bench.bubbleCount; i++) {
          const ph = (u * 3.2 + i * 0.37) % 1;
          dummy.position.set(ABOVE.x + 0.9 * Math.sin(i * 2.1 + ph * 5), lerp(yBottom + 0.3, surface - 0.2, ph), 0.9 * Math.cos(i * 1.7));
          dummy.scale.setScalar((0.35 + 0.65 * Math.sin(Math.PI * ph)) * fade + 0.0001);
          dummy.updateMatrix();
          bubbles.setMatrixAt(i, dummy.matrix);
        }
        bubbles.instanceMatrix.needsUpdate = true;
      }
      added = k >= 0.25;
    } else {
      // the mug: lifted, tipped about its lip, poured, put back
      const f = seg(k, 0.38, 0.82);
      u = f;
      const lift = seg(k, 0, 0.22);
      const back = seg(k, 0.86, 1);
      const e = smooth(lift) * (1 - smooth(back));
      const x = lerp(MUG_REST.x, POUR.x, e);
      const y = lerp(MUG_REST.y, POUR.y, e) + 2.2 * Math.sin(Math.PI * lift) * (1 - smooth(back));
      const theta = (1.25 * smooth(seg(k, 0.1, 0.38)) + 0.12 * f) * (1 - smooth(back)) + 0.08 * e;
      mugGroup.position.set(x, y, 0);
      mugGroup.rotation.z = -theta;
      mugWater.rotation.z = theta;
      const full = k < 0.38 ? 1 - smooth(seg(theta, 0.1, 0.4)) : 0;
      mugWater.scale.setScalar(Math.max(full, 0.0001));
      mugWater.visible = full > 0.01;
      // the stream from the lip to the surface
      const L = litresAt(ex, u);
      const surface = surfaceAt(L);
      const flow = smooth(seg(k, 0.4, 0.46)) * (1 - smooth(seg(k, 0.8, 0.85)));
      stream.visible = flow > 0.01 && y > surface;
      if (stream.visible) {
        stream.position.set(x + 0.15, y, 0);
        stream.scale.set(flow, y - surface, flow);
      }
      added = k >= 0.4;
    }

    const T = tempAt(ex, u);
    const L = litresAt(ex, u);
    water.scale.y = L * BEAKER.perLitre;
    bench.surface.position.y = water.position.y + water.scale.y + 0.01;
    waterColor(T, color);
    waterMat.color.copy(color);
    setScreen(N(tempText(T)));

    out.T = T;
    out.litres = L;
    out.u = u;
    out.pieceT = id === 'iron' ? pieceTempAt(ex, u) : null;
    out.added = added;
    out.mixing = k > 0 && k < 1;
    out.done = k >= 1;
    out.pouring = id === 'water' && stream.visible;
    return out;
  }

  return { apply, showFor, state: out };
}
