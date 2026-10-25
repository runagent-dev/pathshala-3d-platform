// The motion of the CNG auto-rickshaw, in whole ticks of 0.1 s, so every number the panel shows is exact. Pure code
// (no three.js, no DOM), unit-tested in test/unit/acceleration.test.mjs.
//
// সোজা রাস্তা (the straight road): the student holds গতি বাড়াও (gas) or ব্রেক (brake). The speed then changes by a
// fixed amount every tick (সমত্বরণ), so the বেগ–সময় graph is made of straight pieces. Speeds are kept in tenths of
// m/s as whole numbers: a tick of 0.1 s at a ms⁻² changes the speed by exactly a tenths, so +2 per tick is +2 ms⁻²
// and −2 per tick is −2 ms⁻² (every speed is then a multiple of 0.2 m/s, so even a stop ends on a tick). A piece of the graph (a stretch) is a run of ticks of one kind: speeding up ('up',
// ধনাত্মক ত্বরণ), steady or standing ('none', ত্বরণ নেই) or slowing down ('down', মন্দন); its acceleration is
// a = (v − u) / t, the book's formula.
// বাঁক (the bend): the speed stays 2.5 m/s and the student turns the CNG left or right on a circle of 3 m (about the
// tightest a CNG can turn). Headings
// are in radians from east, anticlockwise seen from above (east, north as x, y of a map).

export const TICK = 0.1; // s
export const GAS = 2; // ms⁻² while গতি বাড়াও is held (a CNG pulling away briskly)
export const BRAKE = -2; // ms⁻² while ব্রেক is held (braking, gently enough to stop exactly on a tick)
export const VMAX = 15; // m/s, the top speed here (54 km/h)
export const TRIP = 30; // s of graph
export const TURN = { v: 2.5, r: 3 }; // the bend: 2.5 m/s (9 km/h) on a circle of radius 3 m (v²/r ≈ 2.1 ms⁻²)
export const MIN_LETTER = 1; // s: a stretch gets a letter (A, B, C…) once it lasts this long

export const TICKS = Math.round(TRIP / TICK);
const V10 = VMAX * 10;
const KIND_NAME = { 1: 'up', 0: 'none', '-1': 'down' };

/** The change of speed per tick, in tenths of m/s (= the acceleration in ms⁻²) for a pedal. */
export const pedalAccel = (pedal) => (pedal === 'gas' ? GAS : pedal === 'brake' ? BRAKE : 0);

/**
 * A new trip on the straight road: standing still at the start (or already moving at v0 m/s, for the test's
 * graphs). vs[k] is the speed at tick k (tenths of m/s), xs[k] the distance travelled (m); stretches are the pieces
 * of the graph: { kind, t0, t1 (ticks), u, v (tenths of m/s) }.
 */
export function newTrip(v0 = 0) {
  const vs = new Int16Array(TICKS + 1);
  const xs = new Float64Array(TICKS + 1);
  vs[0] = Math.round(v0 * 10);
  return { n: 0, started: v0 > 0, vs, xs, stretches: [] };
}

/**
 * One tick of 0.1 s with this pedal held: 'gas', 'brake' or anything else (nothing pressed: the speed stays).
 * A trip that has not started waits for the gas. Returns false when nothing happened (not started, or full).
 */
export function tickTrip(trip, pedal) {
  if (trip.n >= TICKS) return false;
  if (!trip.started) {
    if (pedal !== 'gas') return false;
    trip.started = true;
  }
  const k = trip.n;
  const v0 = trip.vs[k];
  const v1 = Math.min(V10, Math.max(0, v0 + pedalAccel(pedal)));
  trip.vs[k + 1] = v1;
  trip.xs[k + 1] = trip.xs[k] + ((v0 + v1) / 20) * TICK; // the mean speed (m/s) × 0.1 s: exact for a steady change
  trip.n = k + 1;
  const kind = KIND_NAME[Math.sign(v1 - v0)];
  const last = trip.stretches.at(-1);
  if (last && last.kind === kind) {
    last.t1 = k + 1;
    last.v = v1;
  } else trip.stretches.push({ kind, t0: k, t1: k + 1, u: v0, v: v1 });
  return true;
}

/** A scripted drive: [[pedal, seconds], …] from a new trip (or the one given). */
export function runTrip(script, trip = newTrip()) {
  for (const [pedal, seconds] of script) {
    const n = Math.round(seconds / TICK);
    for (let i = 0; i < n; i++) tickTrip(trip, pedal);
  }
  return trip;
}

/** A stretch in physics units: t (s), u and v (m/s), a = (v − u) / t (ms⁻²), and whether it ended at a limit. */
export function stretchValues(st) {
  const t = (st.t1 - st.t0) * TICK;
  const u = st.u / 10;
  const v = st.v / 10;
  return { kind: st.kind, t0: st.t0 * TICK, t1: st.t1 * TICK, t: round(t, 1), u, v, a: (st.v - st.u) / (st.t1 - st.t0) };
}

/** The letters of the stretches (A, B, C…, Latin as in the book): only stretches of 1 s or more get one. */
export function lettersOf(stretches) {
  const out = [];
  let next = 0;
  for (const st of stretches) {
    if ((st.t1 - st.t0) * TICK >= MIN_LETTER - 1e-9) out.push(String.fromCharCode(65 + (next++ % 26)));
    else out.push('');
  }
  return out;
}

/** The book's formula, a = (v − u) / t. */
export const accel = (u, v, t) => (v - u) / t;

/** Speed (m/s) and distance (m) of a trip at time `time` (s), in between ticks too (for the picture). */
export function tripAt(trip, time) {
  const k = Math.min(trip.n, Math.max(0, Math.floor(time / TICK + 1e-9)));
  if (k >= trip.n) return { v: trip.vs[trip.n] / 10, x: trip.xs[trip.n], k: trip.n };
  const f = Math.min(1, Math.max(0, time / TICK - k));
  const v0 = trip.vs[k] / 10;
  const v1 = trip.vs[k + 1] / 10;
  return { v: v0 + (v1 - v0) * f, x: trip.xs[k] + (v0 * f + 0.5 * (v1 - v0) * f * f) * TICK, k };
}

// ── the bend ──────────────────────────────────────────────────────────────────

/** Turning rate (rad/s) and the acceleration towards the middle of the circle, v² / r (ms⁻²). */
export const OMEGA = TURN.v / TURN.r;
export const TURN_ACCEL = TURN.v ** 2 / TURN.r;

/** A new drive on the bend: at (0, 0), heading east. */
export const newTurn = () => ({ n: 0, e: 0, north: 0, h: 0, steer: 0 });

/** Where the CNG is after moving for `dt` s from (e, north, h) with steer +1 (left), −1 (right) or 0. */
export function turnStep(e, north, h, steer, dt) {
  if (!steer) return { e: e + TURN.v * dt * Math.cos(h), north: north + TURN.v * dt * Math.sin(h), h };
  const dh = steer * OMEGA * dt;
  const chord = 2 * TURN.r * Math.sin(Math.abs(dh) / 2); // along the circle: the straight line from start to end
  const mid = h + dh / 2;
  return { e: e + chord * Math.cos(mid), north: north + chord * Math.sin(mid), h: h + dh };
}

/** One tick on the bend with this steering ('left', 'right', or anything else: straight on). */
export function tickTurn(st, steer) {
  const s = steer === 'left' ? 1 : steer === 'right' ? -1 : 0;
  const next = turnStep(st.e, st.north, st.h, s, TICK);
  st.e = next.e;
  st.north = next.north;
  st.h = next.h;
  st.steer = s;
  st.n += 1;
  return st;
}

/** The velocity (m/s, east and north) and the acceleration (ms⁻², east and north) on the bend (the arrows). */
export function turnVectors(h, steer) {
  const ve = TURN.v * Math.cos(h);
  const vn = TURN.v * Math.sin(h);
  if (!steer) return { ve, vn, ae: 0, an: 0 };
  const toward = h + steer * (Math.PI / 2); // the middle of the circle: left of the heading for a left turn
  return { ve, vn, ae: TURN_ACCEL * Math.cos(toward), an: TURN_ACCEL * Math.sin(toward) };
}

/** The middle of the circle the CNG is turning on (east, north), r to its left (or right). */
export function turnCentre(e, north, h, steer) {
  return { e: e - steer * TURN.r * Math.sin(h), north: north + steer * TURN.r * Math.cos(h) };
}

/** Eight compass directions for a heading (rad from east, anticlockwise). */
export function dirOf(h) {
  const names = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  const deg = (((h * 180) / Math.PI) % 360) + 360;
  return names[Math.round(deg / 45) % 8];
}

// ── numbers ───────────────────────────────────────────────────────────────────

/** Rounded to d decimals, no binary leftovers. */
export const round = (x, d = 1) => +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
/** With d decimals, and never "-0.0". */
export const fixed = (x, d = 1) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
/** At most d decimals, trailing zeros dropped (for sentences: 2, 1.5, not 2.0). */
export const fmt = (x, d = 2) => String(round(x, d));
/** With a sign in front: +2.0, −3.0, 0.0 (the minus is a real minus sign). */
export function signed(x, d = 1) {
  const s = fixed(x, d);
  if (Number(s) === 0) return s;
  return x > 0 ? `+${s}` : `−${s.slice(1)}`;
}

// ── the test's graphs: shapes like the book's চিত্র ২.০৬, each with a kind that appears only once ──
export const GRAPHS = [
  {
    v0: 0,
    script: [
      ['gas', 5],
      ['none', 4],
      ['gas', 2.5],
      ['brake', 7.5],
    ],
  }, // the book's: A up, B flat, C up, D down to rest
  {
    v0: 0,
    script: [
      ['gas', 4],
      ['brake', 2],
      ['none', 3],
      ['gas', 3],
    ],
  },
  {
    v0: 4,
    script: [
      ['none', 3],
      ['gas', 3],
      ['brake', 2],
      ['gas', 4],
    ],
  },
  {
    v0: 0,
    script: [
      ['gas', 6],
      ['none', 3],
      ['brake', 3],
      ['none', 3],
    ],
  },
  {
    v0: 12,
    script: [
      ['brake', 3],
      ['none', 3],
      ['gas', 1.5],
      ['none', 4],
    ],
  },
];

/** The trip of a test graph, and the kinds that appear exactly once in it (what a question can ask for). */
export function graphTrip(i) {
  const g = GRAPHS[i % GRAPHS.length];
  const trip = runTrip(g.script, newTrip(g.v0));
  const kinds = trip.stretches.map((s) => s.kind);
  const unique = ['up', 'none', 'down'].filter((k) => kinds.filter((x) => x === k).length === 1);
  return { trip, kinds, unique };
}
