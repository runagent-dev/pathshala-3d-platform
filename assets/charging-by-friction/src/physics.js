// The physics of the figure, pure functions (unit-tested in test/unit/charging-by-friction.test.mjs).
//
// 1. Rubbing: which way the electrons go (the book, p.274): glass rubbed with silk gives electrons to the silk; flannel
//    rubbed on plastic gives electrons to the plastic. Each object starts neutral, with as many + (protons, fixed in the
//    material) as − (electrons); only electrons move. `chargeOf` counts what each object carries after `moved` hops.
// 2. The hanging rod (চিত্র ১০.০৩): a rod hangs from a silk thread tied at its middle, so it can only turn about the
//    thread (a vertical axis). The charges on it and on the rod held near it push or pull (Coulomb's law, point charges
//    along each rod, softened a little at very short range); the thread twists back a little (a weak torsion) and the
//    air damps the swing. `torqueY` is the electric turning effect about the thread, `step` one time step of the swing,
//    `settle` the angle the rod comes to rest at. Arbitrary units: only signs and shapes matter on screen.
//
// Positions are [x, y, z] in metres (the figure's world: y up). A rod's angle θ turns it about +y, as three.js does
// (rotation.y = θ maps the rod's own +x to (cos θ, 0, −sin θ)).

/** The rubbing pairs. `from` loses electrons, `to` gains them (the book's words in the figure's i18n). */
export const PAIRS = {
  glass: { rod: 'glass', cloth: 'silk', from: 'rod', to: 'cloth' },
  plastic: { rod: 'plastic', cloth: 'flannel', from: 'cloth', to: 'rod' },
};

/** How many + and − each object shows when neutral, and how many electrons one full rubbing moves. */
export const COUNTS = { rod: 6, rubbed: 4, cloth: 4, moved: 3, strokes: 4 };

/**
 * The charges an object carries after `moved` electrons went across (0…COUNTS.moved, may be fractional while one hops).
 * Returns { plus, minus, net } with net = plus − minus in units of one sign on the screen.
 */
export function chargeOf(pair, part, moved) {
  const p = PAIRS[pair];
  if (!p) throw new Error(`unknown pair ${pair}`);
  const base = part === 'rod' ? COUNTS.rod : COUNTS.cloth;
  const m = Math.max(0, Math.min(COUNTS.moved, moved));
  const sign = p.from === part ? -1 : p.to === part ? 1 : 0;
  const minus = base + sign * m;
  return { plus: base, minus, net: base - minus };
}

/** 'positive' | 'negative' | 'neutral' from a net charge. */
export function kindOf(net) {
  if (net > 1e-9) return 'positive';
  if (net < -1e-9) return 'negative';
  return 'neutral';
}

/**
 * Electrons moved by rubbing, from the strokes rubbed so far: nothing in the first stroke (the cloth and the rod
 * first have to touch closely), then one electron per stroke, up to COUNTS.moved.
 */
export function movedAfter(strokes) {
  return Math.max(0, Math.min(COUNTS.moved, strokes - 1));
}

/** Like charges repel, unlike attract: +1 for a repulsion, −1 for an attraction, 0 if either is neutral. */
export function forceKind(q1, q2) {
  const s = Math.sign(q1) * Math.sign(q2);
  return s;
}

// ── the hanging rod ─────────────────────────────────────────────────────────────────────────────────────────────────

export const SWING = {
  K: 1, // Coulomb's constant in the figure's units
  soft: 0.01, // m: softening, so the force stays finite if two charge points come very close
  torsion: 5, // the thread's twist back, per radian
  inertia: 0.4, // the rod's moment of inertia about the thread: a swing of about 2 s
  damping: 0.9, // the air's drag on the turning rod: it overshoots a little and settles in a few seconds
  max: (80 * Math.PI) / 180, // the rod never turns more than this
  dt: 1 / 240, // s: one step of the swing
};

/**
 * Points on a hanging rod centred at `c`, turned by θ about +y: `n` points from s = `from` to s = `to` along the rod's
 * own x axis (the rubbed part, where its charge sits: an insulator keeps its charge where it was rubbed).
 */
export function hangingPoints(c, from, to, theta, n, out = []) {
  const cs = Math.cos(theta);
  const sn = Math.sin(theta);
  for (let i = 0; i < n; i++) {
    const s = n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1);
    const p = out[i] || (out[i] = [0, 0, 0]);
    p[0] = c[0] + s * cs;
    p[1] = c[1];
    p[2] = c[2] - s * sn;
  }
  out.length = n;
  return out;
}

/**
 * The electric turning effect about the thread (a vertical line through c) on the hanging rod: its charge `hang.q`
 * spread over `hang.n` points from s = `hang.from` to `hang.to`, pushed or pulled by the charges `qs[j]` at `pts[j]`
 * (the held rod; only the first `m` of them count, so a caller can reuse its arrays). Positive turns θ up.
 */
export function torqueY(c, hang, theta, pts, qs, scratch = [], m = pts.length) {
  const n = hang.n;
  const P = hangingPoints(c, hang.from, hang.to, theta, n, scratch);
  const qi = hang.q / n;
  const e2 = SWING.soft * SWING.soft;
  let tau = 0;
  for (let i = 0; i < n; i++) {
    const p = P[i];
    let fx = 0;
    let fz = 0;
    for (let j = 0; j < m; j++) {
      const dx = p[0] - pts[j][0];
      const dy = p[1] - pts[j][1];
      const dz = p[2] - pts[j][2];
      const r2 = dx * dx + dy * dy + dz * dz + e2;
      const f = (SWING.K * qi * qs[j]) / (r2 * Math.sqrt(r2));
      fx += f * dx;
      fz += f * dz;
    }
    const rx = p[0] - c[0];
    const rz = p[2] - c[2];
    // the y part of r × F
    tau += rz * fx - rx * fz;
  }
  return tau;
}

/**
 * One time step of the swing (semi-implicit Euler, fixed dt): state { theta, omega } is changed in place. `torque(θ)`
 * gives the electric turning effect at an angle. Returns the state.
 */
export function step(state, torque, dt = SWING.dt) {
  const tau = torque(state.theta) - SWING.torsion * state.theta - SWING.damping * state.omega;
  state.omega += (tau / SWING.inertia) * dt;
  state.theta += state.omega * dt;
  if (state.theta > SWING.max) {
    state.theta = SWING.max;
    state.omega = Math.min(0, state.omega);
  } else if (state.theta < -SWING.max) {
    state.theta = -SWING.max;
    state.omega = Math.max(0, state.omega);
  }
  return state;
}

/** The angle the rod comes to rest at, from θ0 (the swing run for `seconds`, then a few bisection-free steps). */
export function settle(torque, theta0 = 0, seconds = 12) {
  const s = { theta: theta0, omega: 0 };
  const n = Math.round(seconds / SWING.dt);
  for (let i = 0; i < n; i++) step(s, torque);
  return s.theta;
}

/** True once the swing has died out (less than a tenth of a degree left to go, and hardly turning). */
export function still(state, torque) {
  const tau = torque(state.theta) - SWING.torsion * state.theta;
  return Math.abs(state.omega) < 2e-3 && Math.abs(tau) / SWING.torsion < 1.5e-3;
}
