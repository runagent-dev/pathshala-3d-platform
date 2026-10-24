// The maths of periodic motion, kept apart from the 3D so it can be unit-tested.
//
// Every example is described by its "cycles": how many repetitions it has made since time 0 (a real number that
// only grows). For a periodic motion cycles(t) = t / T + phase0, so the object is back at the same place, moving
// the same way, every T. The fraction part of the cycles (the phase, 0…1) says where on its path the object is.
// A mark on the path is a phase too; the object passes the mark whenever its cycles reach k + mark.
// Times are in each example's own unit (seconds, or years for the comet).

export const TAU = Math.PI * 2;

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);
export const frac = (x) => x - Math.floor(x);

/**
 * The examples of the book (page 37): a fan blade (circular path), Halley's comet round the Sun (elliptical), a
 * mass bouncing on a spring (straight line) and the heartbeat.
 *   period  in `unit` (s or yr)
 *   scale   seconds on the screen per unit of real time (10: ten times slower; 0.1: ten years in a second)
 *   phase0  where the object is at time 0; mark: where the mark starts (phases, 0…1)
 */
export const EXAMPLES = {
  // a ceiling fan at full speed turns about 300 times a minute
  fan: { period: 0.2, unit: 's', scale: 10, phase0: 0.62, mark: 0 },
  // about 76 years; the drawn orbit is less stretched than the real one (e = 0.967), so the motion can be seen;
  // the mark starts near the Sun, where the comet is fastest
  comet: { period: 76, unit: 'yr', scale: 0.1, phase0: 0.92, mark: 0.025, e: 0.86 },
  // 500 g on a spring of 30.8 N/m: T = 2π √(m / k) = 0.8 s, and the spring hangs mg / k = gT² / 4π² ≈ 16 cm
  // longer than its natural length (8 cm); amplitude 7.5 cm, in metres
  spring: { period: 0.8, unit: 's', scale: 1, phase0: 0.05, mark: 0.3, amp: 0.075, mass: 0.5, k: 30.8 },
  // 75 beats a minute; the mark is the tall R wave of the ECG
  heart: { period: 0.8, unit: 's', scale: 1, phase0: 0.55, mark: 0.25 },
};
export const EXAMPLE_IDS = Object.keys(EXAMPLES);

/** A periodic motion: cycles(t) = t / period + phase0, and its inverse. */
export function linearMotion(period, phase0 = 0) {
  return {
    periodic: true,
    cycles: (t) => t / period + phase0,
    timeAt: (c) => (c - phase0) * period,
  };
}

/**
 * A fan switched off: it starts at one turn per `period` and slows down exponentially (time constant `tau`), so
 * each turn takes longer than the one before. Not periodic. cycles never reach phase0 + tau / period.
 */
export function slowingMotion(period, phase0 = 0, tau = 1.5) {
  const total = tau / period; // turns until it stops
  return {
    periodic: false,
    cycles: (t) => phase0 + total * (1 - Math.exp(-Math.max(0, t) / tau)),
    timeAt: (c) => {
      const k = (c - phase0) / total;
      return k >= 1 ? Number.POSITIVE_INFINITY : -tau * Math.log(1 - k);
    },
  };
}

/** The times in (t0, t1] at which the object passes the mark (its cycles reach a whole number + mark). */
export function passTimes(motion, t0, t1, mark) {
  const out = [];
  const c0 = motion.cycles(t0) - mark;
  const c1 = motion.cycles(t1) - mark;
  for (let k = Math.floor(c0 + 1e-9) + 1; k <= Math.floor(c1 + 1e-9); k++) {
    const at = motion.timeAt(k + mark);
    if (Number.isFinite(at)) out.push(at);
  }
  return out;
}

/**
 * Counts repetitions at the mark, as a student with a stopwatch would: the clock starts the first time the object
 * passes the mark; every later pass is one more repetition. total ÷ count = the period.
 */
export function createCounter() {
  let start = null;
  let count = 0;
  let times = []; // the latest passes (the first one may have dropped off a long list)
  return {
    reset() {
      start = null;
      count = 0;
      times = [];
    },
    /** The object passed the mark at time t. */
    pass(t) {
      if (start === null) start = t;
      else count++;
      times.push(t);
      if (times.length > 61) times.shift();
    },
    get started() {
      return start !== null;
    },
    get count() {
      return count;
    },
    /** Time from the first pass to the latest one. */
    get total() {
      return start === null ? 0 : times[times.length - 1] - start;
    },
    /** total ÷ count, or null before the first repetition. */
    get period() {
      return count ? this.total / count : null;
    },
    /** The time each repetition took (the latest ones). */
    get laps() {
      return times.slice(1).map((v, i) => v - times[i]);
    },
    /** The times of the latest passes. */
    get passes() {
      return times.slice();
    },
    /** The stopwatch at time t: running from the first pass. */
    clock: (t) => (start === null ? 0 : t - start),
  };
}

// ── the comet: an ellipse with the Sun at a focus (Kepler) ─────────────────────

/** Eccentric anomaly E for the mean anomaly M (Kepler's equation M = E − e sin E), by Newton's method. */
export function eccentricAnomaly(M, e) {
  const m = ((M % TAU) + TAU) % TAU;
  let E = e < 0.8 ? m : Math.PI;
  for (let i = 0; i < 40; i++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-13) break;
  }
  return E;
}

/** The phase (fraction of a period after perihelion) at which the comet is at eccentric anomaly E. */
export const phaseOfAnomaly = (E, e) => frac((E - e * Math.sin(E)) / TAU);

/**
 * Where the comet is a fraction `phase` of a period after perihelion: the Sun at the origin, perihelion on +x,
 * semi-major axis a. Velocity in a per period (it goes round anticlockwise). r is the distance from the Sun.
 */
export function orbitAt(phase, e, a = 1) {
  return orbitAtAnomaly(eccentricAnomaly(TAU * phase, e), e, a);
}
export function orbitAtAnomaly(E, e, a = 1) {
  const b = a * Math.sqrt(1 - e * e);
  const k = TAU / (1 - e * Math.cos(E)); // dE per period
  return {
    E,
    x: a * (Math.cos(E) - e),
    y: b * Math.sin(E),
    vx: -a * Math.sin(E) * k,
    vy: b * Math.cos(E) * k,
    r: a * (1 - e * Math.cos(E)),
  };
}

// ── the spring: straight up and down ───────────────────────────────────────────

/** Height of the mass above its middle position (top at phase 0) and its velocity, amplitude per period. */
export function springAt(phase, amp) {
  return { y: amp * Math.cos(TAU * phase), vy: -amp * TAU * Math.sin(TAU * phase) };
}
/** The phase at which the mass passes height y (−amp…amp) on its way down. */
export const springPhaseDown = (y, amp) => Math.acos(Math.min(1, Math.max(-1, y / amp))) / TAU;

// ── the heart: an ECG and the beat ─────────────────────────────────────────────

const WAVES = [
  // [centre (phase), height, width]: P, Q, R, S, T
  [0.13, 0.12, 0.022],
  [0.235, -0.1, 0.008],
  [0.25, 1, 0.0085],
  [0.268, -0.22, 0.01],
  [0.47, 0.26, 0.042],
];
/** The ECG trace (about −0.2…1) at a phase of the beat; the tall R wave is at phase 0.25 (the mark). */
export function ecg(phase) {
  let v = 0;
  for (const [c, h, w] of WAVES) {
    const d = frac(phase - c + 0.5) - 0.5; // nearest copy of the wave, so the trace repeats
    v += h * Math.exp(-(d * d) / (2 * w * w));
  }
  return v;
}

const bump = (x, a, b) => (x <= a || x >= b ? 0 : Math.sin((Math.PI * (x - a)) / (b - a)) ** 2);
/** A beat: up fast from `a` to its top at `top`, then slowly back to rest at `b` (0…1). */
function thump(x, a, top, b) {
  if (x <= a || x >= b) return 0;
  if (x < top) return Math.sin(((x - a) / (top - a)) * (Math.PI / 2)) ** 2;
  return Math.cos(((x - top) / (b - top)) * (Math.PI / 2)) ** 2;
}
/** How much the heart is squeezed (0…1): the atria after the P wave, the ventricles in a quick thump after the R wave. */
export function heartSqueeze(phase) {
  const p = frac(phase);
  return { atria: bump(p, 0.12, 0.26), ventricles: thump(p, 0.255, 0.31, 0.62) };
}

// ── numbers for the panel and the test ─────────────────────────────────────────

/** A time as the panel writes it: seconds with two decimals, years as whole years. */
export const fmtTime = (v, unit) => (unit === 'yr' ? String(Math.round(v)) : roundTo(v, 0.01).toFixed(2));

/** A number for an answer: up to `d` decimals, no trailing zeros ("0.8", "1.25", "76"); very small ones keep 2 figures. */
export function fmtNum(v, d = 2) {
  if (v !== 0 && Math.abs(v) < 0.1) return String(+v.toPrecision(2));
  return String(+v.toFixed(d));
}

/**
 * Wrong answers for "n repetitions take `total`: what is the period?", from the usual mistakes: dividing the
 * other way, counting the start as one (dividing by n − 1), and forgetting to divide. Distinct as written.
 */
export function periodMistakes(total, n) {
  const right = total / n;
  const seen = new Set([fmtNum(right)]);
  const out = [];
  for (const v of [n / total, total / (n - 1), total, total * n]) {
    const key = fmtNum(v);
    if (!(v > 0) || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * Wrong answers for "the heart beats `bpm` times a minute: the period in seconds?": dividing the other way,
 * forgetting that a minute is 60 seconds (1 ÷ beats), taking the number of beats for the period.
 */
export function heartMistakes(bpm) {
  const right = 60 / bpm;
  const seen = new Set([fmtNum(right)]);
  const out = [];
  for (const v of [bpm / 60, 1 / bpm, bpm, 60 / (bpm - 1)]) {
    const key = fmtNum(v);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length === 3) break;
  }
  return out;
}
