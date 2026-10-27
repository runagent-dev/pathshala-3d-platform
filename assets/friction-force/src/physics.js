// The physics of the figure, in metres, kilograms, newtons and seconds, as pure functions (unit-tested in
// test/unit/friction-force.test.mjs). A wooden block lies on a table and is pushed along it by a hand (a push rod).
//
// The model is the simplest one that is true: the table can hold the block back with a friction force f that is
// whatever the push F needs, up to a largest value, μ × (the force pressing the block down). Below it the block does
// not move and f = F (equal and opposite). Push harder than that and the block slides with f staying at that largest
// value: the push minus the friction is what is left over, and it speeds the block up (a = (F − f) / m). When the
// hand lets go, friction alone slows it to a stop (a = μ g). One μ (0.5) is used for resting and for sliding: the
// book's pages 88–89 have no formula; the next figure (types of friction, 3.9.1) tells static and kinetic friction
// apart. The weights add to the force pressing down: 2 kg block (19.6 N), 3 kg (29.4 N), 4 kg (39.2 N); so the most
// friction, and the push at which the block starts to slide, is 9.8, 14.7, 19.6 N.

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
// once it gives way the hand keeps pushing: the push goes on past the friction by m × A_NET newtons (reached over
// T_PUSH_UP s), so the block speeds up at up to A_NET whatever the weights; then the hand lets go
export const A_NET = 1.2; // m/s²
export const T_PUSH_UP = 0.4; // s
export const T_SLIP = 0.7; // s the hand pushes on after the block gave way

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

/** N: how far past the friction the push goes (it is this, over the mass, that speeds the block up). */
export const extraOf = (load) => round(massOf(load) * A_NET, 1);
/** m/s² the friction slows a sliding block at once the hand lets go (μ g). */
export const SLOWING = MU * G;

/** s at which each phase of a push starts: rise, hold, climb, slip, release (the hand lets go); done when it has stopped. */
export function pushTimes(load) {
  const c = capacity(load);
  const rise = 0;
  const hold = T_RISE;
  const climb = hold + T_HOLD;
  const slip = climb + (c - GENTLE) / RATE;
  const release = slip + T_SLIP;
  const done = release + coastTime();
  return { rise, hold, climb, slip, release, done, c };
}

/** Speed (m/s) and distance (m) τ s after the block gave way, while the hand pushes on (τ ≤ T_PUSH_UP: a smooth start, then steady). */
export function speedUp(tau) {
  const T = T_PUSH_UP;
  const u = clamp(tau / T, 0, 1);
  if (tau <= 0) return { v: 0, x: 0 };
  if (tau <= T) return { v: A_NET * T * (u ** 3 - u ** 4 / 2), x: A_NET * T * T * (u ** 4 / 4 - u ** 5 / 10) };
  const d = tau - T;
  const v1 = A_NET * T * 0.5;
  return { v: v1 + A_NET * d, x: A_NET * T * T * 0.15 + v1 * d + 0.5 * A_NET * d * d };
}
/** Speed (m/s) and distance (m) when the hand lets go. */
const atRelease = () => speedUp(T_SLIP);
/** s the block coasts on after the hand lets go, slowed by friction alone. */
export function coastTime() {
  return atRelease().v / SLOWING;
}

/**
 * One push, t s after the hand started: phase 'rise' | 'hold' | 'climb' | 'slip' | 'coast' | 'done'.
 * F the push (N), f the friction (N): at rest f = F exactly; once the block gives way f stays at the most the table can
 * hold (limit) while F goes on past it, so the block speeds up; after the hand lets go F is 0 and friction slows it.
 * slide: how far the block has moved (m); v its speed (m/s); moving: it is sliding; padX: how far the rod's pad has
 * followed (it stops where the hand let go).
 */
export function pushAt(t, load) {
  const T = pushTimes(load);
  const c = T.c;
  const still = { v: 0, slide: 0, moving: false, limit: c, padX: 0 };
  if (t < T.hold) {
    const F = round(GENTLE * smooth(t / T_RISE), 2);
    return { ...still, phase: 'rise', F, f: F };
  }
  if (t < T.climb) return { ...still, phase: 'hold', F: GENTLE, f: GENTLE };
  if (t < T.slip) {
    const F = round(GENTLE + RATE * (t - T.climb), 2);
    return { ...still, phase: 'climb', F, f: F };
  }
  if (t < T.release) {
    const tau = t - T.slip;
    const s = speedUp(tau);
    const F = round(c + extraOf(load) * smooth(tau / T_PUSH_UP), 2);
    return { phase: 'slip', F, f: c, v: s.v, slide: s.x, moving: true, limit: c, padX: s.x };
  }
  const r = atRelease();
  const tc = t - T.release;
  if (t < T.done)
    return { phase: 'coast', F: 0, f: c, v: r.v - SLOWING * tc, slide: r.x + r.v * tc - 0.5 * SLOWING * tc * tc, moving: true, limit: c, padX: r.x };
  return { phase: 'done', F: 0, f: 0, v: 0, slide: pushDistance(), moving: false, limit: c, padX: r.x };
}
/** Seconds the whole push takes. */
export const pushDuration = (load) => pushTimes(load).done;
/** Where the block ends up after a push (m along the push): the same for every weight (the same speeding up and slowing down). */
export const pushDistance = () => {
  const r = atRelease();
  return r.x + (r.v * r.v) / (2 * SLOWING);
};

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
