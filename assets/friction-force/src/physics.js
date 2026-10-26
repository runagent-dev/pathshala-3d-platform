// The physics of the figure, in metres, kilograms, newtons and seconds, as pure functions (unit-tested in
// test/unit/friction-force.test.mjs). A wooden block lies on a table and is pushed along it by a hand (a push rod).
//
// The model is the simplest one that is true: the table can hold the block back with a friction force f that is
// whatever the push F needs, up to a largest value, μ × (the force pressing the block down). Below that most, the block does
// not move and f = F (equal and opposite). The moment the push reaches it, the block starts to slide, and then it
// slides steadily with f = F again. One μ (0.5) is used for both: the book's page 88–89 has no formula; the next
// figure (types of friction, 3.9.1) is where static and kinetic friction are told apart. The weights add to the
// force pressing down: 2 kg block (19.6 N), 3 kg (29.4 N), 4 kg (39.2 N); so the most friction is 9.8, 14.7, 19.6 N.

export const G = 9.8; // m/s²
export const MU = 0.5; // the wood-on-wood grip, one number (not shown to the student)
export const BLOCK_KG = 2;
export const WEIGHT_KG = 1; // each weight on the block
export const MAX_LOAD = 2; // weights
export const LOADS = [0, 1, 2];

// the push: a gentle push first (held, so the student can read it), then harder at a steady rate until the block gives way
export const GENTLE = 5; // N
export const RATE = 6; // N/s
export const T_RISE = 0.8; // s to the gentle push
export const T_HOLD = 1.0; // s it is held
export const T_SLIP = 1.1; // s the block slides on once it gives way
export const T_LET_GO = 0.35; // s the hand lets go
export const SLIP_SPEED = 0.15; // m/s: how fast it creeps while the push stays at the limit (F = f, steady)
const SLIP_EASE = 0.12; // s: it picks up its creep speed over about this long

export const round = (x, d = 1) => +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
};

/** kg of the block with `load` weights on it. */
export const massOf = (load) => BLOCK_KG + clamp(Math.round(load), 0, MAX_LOAD) * WEIGHT_KG;
/** N: what presses the block down (its weight with the weights on it); weight and friction are at right angles. */
export const weightOf = (load) => round(massOf(load) * G);
/** N: the most friction the table can give, so the push at which the block starts to slide (9.8, 14.7, 19.6). */
export const capacity = (load) => round(MU * massOf(load) * G);

/** s at which each phase of a push starts: rise, hold, climb, slip, let go, done. */
export function pushTimes(load) {
  const c = capacity(load);
  const rise = 0;
  const hold = T_RISE;
  const climb = hold + T_HOLD;
  const slip = climb + (c - GENTLE) / RATE;
  const letGo = slip + T_SLIP;
  const done = letGo + T_LET_GO;
  return { rise, hold, climb, slip, letGo, done, c };
}

/** How far the block has crept (m) τ s after it started to slide: a short ease into the creep speed, then steady. */
export function creep(tau) {
  if (tau <= 0) return 0;
  return SLIP_SPEED * (tau + SLIP_EASE * (Math.exp(-tau / SLIP_EASE) - 1));
}

/**
 * One push, t s after the hand started: phase 'rise' | 'hold' | 'climb' | 'slip' | 'letgo' | 'done'; F the push (N);
 * f the friction (N, always equal to F: at rest it is exactly as big as the push, while sliding steadily too); the
 * slide (m) the block has crept along the push; moving: whether it is sliding.
 */
export function pushAt(t, load) {
  const T = pushTimes(load);
  const c = T.c;
  const slideEnd = creep(T_SLIP);
  if (t < T.hold) return { phase: 'rise', F: round(GENTLE * smooth(t / T_RISE), 2), slide: 0, moving: false, limit: c };
  if (t < T.climb) return { phase: 'hold', F: GENTLE, slide: 0, moving: false, limit: c };
  if (t < T.slip) return { phase: 'climb', F: round(GENTLE + RATE * (t - T.climb), 2), slide: 0, moving: false, limit: c };
  if (t < T.letGo) return { phase: 'slip', F: c, slide: creep(t - T.slip), moving: true, limit: c };
  if (t < T.done) return { phase: 'letgo', F: round(c * (1 - smooth((t - T.letGo) / T_LET_GO)), 2), slide: slideEnd, moving: false, limit: c };
  return { phase: 'done', F: 0, slide: slideEnd, moving: false, limit: c };
}
/** Seconds the whole push takes. */
export const pushDuration = (load) => pushTimes(load).done;
/** Where the block ends up after a push (m along the push). */
export const pushDistance = () => creep(T_SLIP);

// rubbing: the hand moves the block back and forth, so it slides all the time and friction turns round with every
// stroke (always against the motion), and the surfaces warm up
export const RUB = { amplitude: 0.1, period: 1.1, ramp: 0.5, time: 4.4, warm: 4 }; // m, s, s, s, s to fully warm

/**
 * The rub t s after it started: x the block's offset (m), v its velocity (m/s, + to the right), dir the sign of the
 * motion, F the hand's push and f the friction (N: as long as it slides at a steady pace both are the table's most;
 * they shrink to nothing as it turns round, since the block is then standing still).
 */
export function rubAt(t, load) {
  const c = capacity(load);
  const w = (2 * Math.PI) / RUB.period;
  const a = RUB.amplitude * smooth(t / RUB.ramp);
  const x = a * Math.sin(w * t);
  const v = RUB.amplitude * w * Math.cos(w * t) * smooth(t / RUB.ramp);
  const dir = v >= 0 ? 1 : -1;
  const sliding = smooth(Math.abs(v) / 0.12);
  const done = t >= RUB.time;
  if (done) return { phase: 'done', x: 0, v: 0, dir: 1, F: 0, f: 0, limit: c };
  return { phase: 'rub', x, v, dir, F: round(c * sliding, 2), f: round(c * sliding, 2), limit: c };
}

/** Warming while it is rubbed (to 1 over RUB.warm s), cooling slowly after. dt in seconds. */
export function warm(h, rubbing, dt) {
  return clamp(h + (rubbing ? dt / RUB.warm : -dt / 9), 0, 1);
}

/**
 * The tiny teeth of the two surfaces, drawn far bigger than life (the lens): one period of the lower (table) surface,
 * as [x, y] corners from valley to valley; the upper surface (the block's) is the same shape, so the teeth of one
 * lock in the grooves of the other. `bite` (0…1) is how deep the block's teeth have sunk into the grooves: more
 * weight, deeper.
 */
export const TEETH = {
  period: 1.6,
  corners: [
    [0, 0],
    [0.45, 0.75],
    [0.85, 0.09],
    [1.2, 0.5],
    [1.6, 0],
  ],
};
/** Depth of the lock for 0, 1, 2 weights: 0.35, 0.65, 0.92 of the tooth height. */
export const biteOf = (load) => [0.35, 0.65, 0.92][clamp(Math.round(load), 0, MAX_LOAD)];

/** The height of the lower surface at x (the profile repeats every TEETH.period). */
export function teethY(x) {
  const p = TEETH.period;
  const u = ((x % p) + p) % p;
  const c = TEETH.corners;
  for (let i = 1; i < c.length; i++) {
    if (u <= c[i][0] + 1e-12) {
      const [x0, y0] = c[i - 1];
      const [x1, y1] = c[i];
      return y0 + ((y1 - y0) * (u - x0)) / (x1 - x0);
    }
  }
  return 0;
}

/** The gap left between the two surfaces at rest (teeth units): pressed deeper, thinner. */
export const gapOf = (bite) => 0.34 * (1 - bite);

/**
 * The block's surface at rest: the table's shape again, so the teeth of one lock into the grooves of the other, with
 * a thin gap that closes as the bite deepens.
 */
export function upperY(x, bite) {
  return teethY(x) + gapOf(bite);
}

/**
 * How high the block rides up when it is moved s sideways (the same shape moved rigidly, as high as it must to
 * clear the table's teeth). 0 at s = 0 and again at s = one period: the teeth drop back into the next grooves.
 */
export function climb(s, bite, step = 0.01) {
  const p = TEETH.period;
  let g = 0;
  for (let x = 0; x < p; x += step) g = Math.max(g, teethY(x) - upperY(x - s, bite)); // never negative: g starts at 0
  return g;
}
