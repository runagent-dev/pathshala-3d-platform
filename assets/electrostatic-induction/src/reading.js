// The figure's maths, pure functions (unit-tested in test/unit/electrostatic-induction.test.mjs). Sizes in metres.
//
// The charges: each metal sphere has SITES fixed positive charges (its atoms' protons: they never move) and as many
// electrons. Neutral, every electron sits under its own "+": a "±" pair, as the book draws a neutral sphere (চিত্র
// ১০.০৪). Induction moves electrons only: toward a positive rod, away from a negative one. The figure draws a few of
// them (the real number is enormous), and says so.

/** The sphere's radius and the most electrons the figure moves (with the rod at its nearest). */
export const R = 0.055;
export const SITES = 24;
export const NMAX = 8;
/** The rod's gap to the sphere's surface: the nearest (where NMAX move), the drag's range and where it waits. */
export const G_NEAR = 0.012;
export const G_MIN = 0.012;
export const G_FAR = 0.11;
export const G_OUT = 0.32;

/**
 * How many of the drawn electrons a positive rod `gap` metres from the sphere pulls to the near side. The rod's
 * field at the sphere falls as 1/d² (d from the sphere's centre), and so does the charge it separates; the figure
 * draws none of it at the far end of the drag (the sphere reads as having no charge), NMAX at the nearest gap, and
 * rounds down in between.
 */
const pull = (gap) => ((R + G_NEAR) / (R + gap)) ** 2;
export function induced(gap) {
  const g = Math.max(G_MIN, gap);
  const k = (pull(g) - pull(G_FAR)) / (1 - pull(G_FAR));
  return Math.max(0, Math.min(NMAX, Math.floor(NMAX * k + 1e-9)));
}

/** The gap in whole centimetres, as the panel shows it. */
export const gapCm = (gap) => Math.round(gap * 100);

// ── points on a sphere (unit vectors as [x, y, z]) ───────────────────────────────────────────────────────────────

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** The angle between two unit vectors (radians). */
export const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));

/** n points spread evenly over a sphere (a Fibonacci spiral), turned by `turn` radians about the vertical. */
export function fibonacci(n, turn = 0) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden + turn;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
}

/**
 * Greedy far-point choice: from `candidates`, `count` points, each as far as possible from `avoid` and from the
 * ones already chosen (the smallest angle to any of them, largest first). `inside(p)` limits the candidates.
 */
export function spreadPoints(candidates, count, avoid = [], inside = () => true) {
  const pool = candidates.filter(inside);
  const chosen = [];
  for (let k = 0; k < count && pool.length; k++) {
    let best = -1;
    let bestD = -1;
    for (let i = 0; i < pool.length; i++) {
      let d = Number.POSITIVE_INFINITY;
      for (const q of avoid) d = Math.min(d, angle(pool[i], q));
      for (const q of chosen) d = Math.min(d, angle(pool[i], q));
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    chosen.push(pool.splice(best, 1)[0]);
  }
  return chosen;
}

/**
 * The places a sphere's charges can be (in the sphere's own frame, unit vectors): its SITES fixed "+"; the near cap
 * toward a rod along `toward` (NMAX * 2 places for extra electrons, crowded within `capDeg` of it, clear of the sites);
 * and NMAX places spread evenly over the whole sphere for extra electrons with no rod near. `turn` turns the sites'
 * pattern, so two spheres don't look stamped from one mould.
 */
export function layout(toward = [-1, 0, 0], { capDeg = 62, turn = 0.35 } = {}) {
  const sites = fibonacci(SITES, turn);
  const t = norm(toward);
  const dense = fibonacci(420, 0.1);
  const cos = Math.cos((capDeg * Math.PI) / 180);
  const cap = spreadPoints(dense, NMAX * 2, sites, (p) => dot(p, t) > cos);
  // the cap's places, nearest to the rod first
  cap.sort((a, b) => dot(b, t) - dot(a, t));
  const spread = spreadPoints(dense, NMAX, sites);
  return { sites, cap, spread, toward: t };
}

/** The `n` sites farthest from `toward` (where a positive rod leaves "+" bare), farthest first. */
export function farSites(sites, toward, n) {
  return sites
    .map((p, i) => ({ i, d: dot(p, toward) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.i);
}

/** `n` sites spread evenly over the sphere (where the "+" left bare sit once nothing pulls the electrons). */
export function evenSites(sites, n) {
  const chosen = spreadPoints(sites, n);
  return chosen.map((p) => sites.indexOf(p));
}

/**
 * Pairs each electron with one target place, so that as few as possible move and none moves farther than it must:
 * electrons already at a target stay; the rest, shortest trip first. `cost(e, t)` is the trip's length (Infinity: the
 * electron can't get there). Returns target index per electron (-1 for none).
 */
export function assign(electrons, targets, cost, same) {
  const out = new Array(electrons.length).fill(-1);
  const taken = new Array(targets.length).fill(false);
  for (let e = 0; e < electrons.length; e++)
    for (let k = 0; k < targets.length; k++)
      if (!taken[k] && same(electrons[e], targets[k])) {
        out[e] = k;
        taken[k] = true;
        break;
      }
  const pairs = [];
  for (let e = 0; e < electrons.length; e++) {
    if (out[e] >= 0) continue;
    for (let k = 0; k < targets.length; k++) if (!taken[k]) pairs.push([cost(electrons[e], targets[k]), e, k]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  for (const [c, e, k] of pairs) {
    if (out[e] >= 0 || taken[k] || !Number.isFinite(c)) continue;
    out[e] = k;
    taken[k] = true;
  }
  return out;
}

/** The net charge of a sphere in drawn charges: + for missing electrons, − for extra ones. */
export const netCharge = (electronsOn) => SITES - electronsOn;

// ── the comb and the paper (চিত্র ১০.০৫): one timeline, seconds ─────────────────────────────────────────────────
/** The comb comes down; the paper's near part turns +, far part −; the bits jump up, stick, turn −, and fall away. */
export const COMB = { lower: [0, 1.8], polar: [1.8, 2.8], jump: [2.8, 3.6], stick: [3.6, 4.6], fall: [4.6, 6.0], end: 6.2 };
/** 0…1 progress of `t` through [a, b]. */
export const seg = (t, [a, b]) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/** What the comb scene shows at time t: the comb's height (0 up, 1 down), the paper's charges, the bits' flight. */
export function combPhase(t) {
  return {
    lower: seg(t, COMB.lower),
    polar: seg(t, COMB.polar),
    jump: seg(t, COMB.jump),
    stuck: t >= COMB.jump[1] && t < COMB.fall[0] + 0.05,
    charged: seg(t, [COMB.stick[0] + 0.3, COMB.stick[0] + 0.7]), // the bits' charge turns from + to −
    fall: seg(t, COMB.fall),
  };
}
