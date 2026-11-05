// The beads on the paper at the far end of the tube: a few round bodies rolling inside the triangle when the tube is turned.
// Pure and deterministic (no clock of its own, fixed steps, nothing allocated while it runs), so the same turns give the
// same pattern, and an idle figure costs nothing: `settled` says when it has stopped.
import { TUBE, WALLS } from './reading.js';

// What the book puts in: "রঙিন পাথর, পুঁতি, ভাঙা কাচের চুড়ি". kind 0 a coloured stone, 1 a bead with a hole, 2 a piece of bangle
export const PIECES = [
  { kind: 0, r: 0.46, colour: '#e0203a', x: -0.5, y: -0.55 },
  { kind: 2, r: 0.42, colour: '#0f9d6c', x: 0.75, y: -0.6 },
  { kind: 1, r: 0.32, colour: '#f2a60d', x: 0.15, y: 0.1 },
  { kind: 0, r: 0.4, colour: '#1668dc', x: -1.1, y: 0.05 },
  { kind: 2, r: 0.4, colour: '#d4259b', x: -0.1, y: 0.75 },
  { kind: 1, r: 0.3, colour: '#12a7c9', x: 1.25, y: 0.15 },
  { kind: 0, r: 0.36, colour: '#ff7a1a', x: 0.4, y: 1.1 },
  { kind: 1, r: 0.28, colour: '#7b3fe4', x: -0.5, y: 1.45 },
  { kind: 2, r: 0.36, colour: '#e6c60c', x: -1.5, y: -0.6 },
];
const G = 70; // cm/s²: the beads slide on paper, and are slowed so that the eye can follow them (the panel says so)
const DRAG = 2.6; // the paper's slowing, 1/s
const STEP = 1 / 120;
const BOUNCE = 0.25;
const SOFT = 1.6; // a touch slower than this does not bounce, cm/s
const REST = 0.3; // below this speed a body counts as still, cm/s
const LONGEST = 6; // s: after this long without a new pull everything has stopped, whatever the numbers say

export function createBeads() {
  const n = PIECES.length;
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const wasX = new Float64Array(n);
  const wasY = new Float64Array(n);
  const angle = new Float64Array(n);
  const radius = PIECES.map((b) => b.r);
  let gx = 0;
  let gy = -1;
  let left = 0;
  let quiet = 0;
  let age = 0;
  function restart() {
    PIECES.forEach((b, i) => {
      px[i] = b.x;
      py[i] = b.y;
      vx[i] = 0;
      vy[i] = 0;
      angle[i] = i * 1.7;
    });
    gx = 0;
    gy = -1;
    for (let i = 0; i < 1200; i++) substep();
    quiet = 1;
  }
  function substep() {
    const c = Math.exp(-DRAG * STEP);
    for (let i = 0; i < n; i++) {
      wasX[i] = px[i];
      wasY[i] = py[i];
      vx[i] = (vx[i] + gx * G * STEP) * c;
      vy[i] = (vy[i] + gy * G * STEP) * c;
      // they roll: the turn goes with the speed across the pull
      angle[i] += ((vx[i] * gy - vy[i] * gx) * STEP) / radius[i];
      px[i] += vx[i] * STEP;
      py[i] += vy[i] * STEP;
    }
    for (let k = 0; k < 5; k++) {
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const dx = px[j] - px[i];
          const dy = py[j] - py[i];
          const min = radius[i] + radius[j] + 0.015;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 < 1e-12) continue;
          const d = Math.sqrt(d2);
          const ux = dx / d;
          const uy = dy / d;
          const push = (min - d) / 2;
          px[i] -= ux * push;
          py[i] -= uy * push;
          px[j] += ux * push;
          py[j] += uy * push;
          const rel = (vx[j] - vx[i]) * ux + (vy[j] - vy[i]) * uy;
          if (rel < 0) {
            const q = (-(1 + (rel < -SOFT ? BOUNCE : 0)) * rel) / 2;
            vx[i] -= q * ux;
            vy[i] -= q * uy;
            vx[j] += q * ux;
            vy[j] += q * uy;
          }
        }
      for (let i = 0; i < n; i++)
        for (const w of WALLS) {
          const lim = TUBE.r - radius[i];
          const over = px[i] * w.n[0] + py[i] * w.n[1] - lim;
          if (over <= 0) continue;
          px[i] -= over * w.n[0];
          py[i] -= over * w.n[1];
          const out = vx[i] * w.n[0] + vy[i] * w.n[1];
          if (out > 0) {
            const k = 1 + (out > SOFT ? BOUNCE : 0);
            vx[i] -= k * out * w.n[0];
            vy[i] -= k * out * w.n[1];
          }
        }
    }
  }
  restart();
  return {
    px,
    py,
    angle,
    radius,
    count: n,
    restart,
    get settled() {
      return quiet > 0.4;
    },
    /** The pull in the tube's frame, a unit vector. */
    pull(x, y) {
      if (Math.abs(x - gx) + Math.abs(y - gy) < 1e-6) return;
      gx = x;
      gy = y;
      quiet = 0;
      age = 0;
    },
    /** Moves on by dt seconds. True while anything moved. */
    run(dt) {
      if (quiet > 0.4) return false;
      left += dt;
      while (left >= STEP) {
        left -= STEP;
        substep();
        // what counts is how far they really went, after the walls and each other have pushed back
        let fast = 0;
        for (let i = 0; i < n; i++) fast = Math.max(fast, Math.abs(px[i] - wasX[i]) + Math.abs(py[i] - wasY[i]));
        age += STEP;
        quiet = fast / STEP < REST ? quiet + STEP : 0;
        if (age > LONGEST) quiet = 1;
      }
      return true;
    },
    /** Turns everything by a whole symmetry of the triangle (the tube looks the same): keeps the picture, resets the frame. */
    spin(a) {
      const c = Math.cos(a);
      const s = Math.sin(a);
      for (let i = 0; i < n; i++) {
        const x = px[i];
        const y = py[i];
        px[i] = x * c + y * s;
        py[i] = y * c - x * s;
        const u = vx[i];
        const v = vy[i];
        vx[i] = u * c + v * s;
        vy[i] = v * c - u * s;
        angle[i] -= a;
      }
    },
  };
}
