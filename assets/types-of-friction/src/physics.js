// The maths of the figure (pure functions, unit-tested in test/unit/types-of-friction.test.mjs): a wooden block, the
// three frictions on it and a person pushing it with a force gauge.
//
// The book gives the three kinds of friction and f_s = μ_s N, f_k = μ_k N (pages 89–90) but no numbers. The numbers
// here are examples (and the figure says so), the same as the sister figure friction-force (page 88): a 2 kg block
// (weight 19.6 N on the flat floor, so N = 19.6 N), μ_s = 0.5 (it starts to slide at 9.8 N; with 1 kg on top 14.7 N,
// with 2 kg 19.6 N), μ_k = 0.4 (7.84 N once it slides) and, on wheels, a rolling coefficient of 0.05 (0.98 N).
export const G = 9.8; // ms⁻², as the book (balanced-forces, falling-bodies)
export const MASS = 2; // kg
export const MU = { s: 0.5, k: 0.4, r: 0.05 };
export const V_STEADY = 0.12; // m/s: the pace the person keeps once the block moves
export const CRUISE = { floor: 0.5, wheels: 1.2 }; // s: how fast the person settles into that pace (per support)
export const NOTCHES = [3, 6, 9]; // N: the push of the first three taps (the fourth pushes past the maximum)
export const RATE = { up: 4, down: 4, release: 15 }; // N/s: how fast the push changes
export const RATE_WHEELS_UP = 2.5; // N/s: the push rises more slowly on wheels, where the numbers are 10 times smaller

/** Weight of a mass (N); on the flat floor the floor pushes up with exactly this: the normal force N. */
export const weight = (mass = MASS) => mass * G;

/**
 * The two numbers that matter on a support: `max`, the most the block can be held by (the maximum static friction,
 * or on wheels the rolling friction, which has no peak), and `move`, the friction while it moves.
 * @param {'floor' | 'wheels'} on
 */
export function limits(on, mass = MASS) {
  const N = weight(mass);
  return on === 'wheels' ? { max: MU.r * N, move: MU.r * N } : { max: MU.s * N, move: MU.k * N };
}

export const round = (x, d = 0) => {
  const k = 10 ** d;
  return Math.round(x * k) / k;
};

/** A force for the screen: whole newtons when it is whole, else one decimal (9.8, 7.8, 1). */
export const fmtForce = (f) => {
  const r = round(f, 1);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

/** The push a person gives to keep the pace: the friction plus what it takes to speed up to V_STEADY (never below 0). */
export function cruiseGoal(on, mass, v) {
  const { move } = limits(on, mass);
  return Math.max(0, move + (mass * (V_STEADY - v)) / CRUISE[on]);
}

/**
 * One time step. `st` = { on, mass, pull, v, x, moving }; `goal` is the push the person is heading for (`pull` is the
 * push, the number the force gauge shows). It follows the goal at a limited rate. At rest the friction matches the
 * push up to `max`; past it the block moves and the friction is `move`, so m·a = push − friction.
 * Returns a new state with `friction` (the force of the friction now) and `broke` (true on the step it starts).
 */
export function step(st, dt, goal, rate = RATE) {
  let pull = st.pull;
  pull = goal > pull ? Math.min(goal, pull + rate.up * dt) : Math.max(goal, pull - (st.moving ? rate.release : rate.down) * dt);
  const { max, move } = limits(st.on, st.mass);
  let { v, x, moving } = st;
  let broke = false;
  let friction = Math.min(pull, max);
  if (!moving && pull > max + 1e-9) {
    moving = true;
    broke = true;
  }
  if (moving) {
    friction = move;
    v += ((pull - move) / st.mass) * dt;
    if (v <= 0) {
      v = 0;
      moving = false;
      friction = Math.min(pull, max);
    }
    x += v * dt;
  }
  return { ...st, pull, v, x, moving, friction, broke };
}

/** The hand lets go: the push is 0 at once, so the friction alone stops a moving block (nothing fades). */
export const letGo = (st) => ({ ...st, pull: 0, friction: st.moving ? st.friction : 0 });

/** The whole story of one tap on a support, from rest with the push rising: states every step (for tests). */
export function simulate(on, mass, { seconds = 8, dt = 1 / 120, up = on === 'wheels' ? RATE_WHEELS_UP : RATE.up, cruiseFor = 3 } = {}) {
  let st = { on, mass, pull: 0, v: 0, x: 0, moving: false, friction: 0, broke: false };
  const { max } = limits(on, mass);
  let goal = 1.4 * max;
  let since = null;
  const out = [];
  for (let i = 0; i * dt < seconds; i++) {
    st = step(st, dt, goal, { ...RATE, up });
    if (st.broke) since = 0;
    if (since != null) {
      since += dt;
      goal = since < cruiseFor ? cruiseGoal(on, mass, st.v) : 0;
    }
    out.push({ t: i * dt, ...st });
  }
  return out;
}
