// The maths of the figure's nuclei (book p69, topic 3.2.4), kept apart from the 3D: balls packed into round
// clusters, seeded, so the same nucleus is drawn every time. Distances are in femtometres (fm): 1 fm = 10⁻¹⁵ m.

export const R_NUCLEON = 0.85; // fm, about the radius of a proton (0.84 fm) or a neutron

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** A small seeded random number generator (mulberry32), so the clusters are the same on every load. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * n balls of radius r packed into a round cluster round the origin: random start, then the overlaps are pushed
 * apart while everything is drawn to the centre. `init` (optional) gives starting points; `squeeze` lets
 * neighbours overlap a little, as the balls of a nucleus model do. Returns [[x, y, z], …].
 */
export function packCluster(n, { r = R_NUCLEON, seed = 1, init = null, squeeze = 0.06, rounds = 160 } = {}) {
  const rand = rng(seed);
  const ballR = r * Math.cbrt(n / 0.62);
  const p = init
    ? init.map((q) => [...q])
    : Array.from({ length: n }, () => {
        for (;;) {
          const v = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
          if (v[0] ** 2 + v[1] ** 2 + v[2] ** 2 <= 1) return v.map((x) => x * ballR);
        }
      });
  const gap = 2 * r * (1 - squeeze);
  for (let k = 0; k < rounds; k++) {
    const pull = 0.04 * (1 - k / rounds);
    for (const q of p) for (let j = 0; j < 3; j++) q[j] -= q[j] * pull;
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = p[i];
          const b = p[j];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const dz = b[2] - a[2];
          const d = Math.hypot(dx, dy, dz) || 1e-6;
          if (d >= gap) continue;
          const push = (gap - d) / d / 2;
          a[0] -= dx * push;
          a[1] -= dy * push;
          a[2] -= dz * push;
          b[0] += dx * push;
          b[1] += dy * push;
          b[2] += dz * push;
        }
  }
  // centre it
  const c = [0, 1, 2].map((j) => p.reduce((sum, q) => sum + q[j], 0) / n);
  return p.map((q) => [q[0] - c[0], q[1] - c[1], q[2] - c[2]]);
}

/** The radius of a cluster: the farthest ball's outer edge from the centre. */
export function clusterRadius(points, r = R_NUCLEON) {
  return Math.max(...points.map((q) => Math.hypot(q[0], q[1], q[2]))) + r;
}

/** Which balls are protons: `z` of them, spread through the cluster (seeded). Returns a boolean per ball. */
export function chooseProtons(n, z, seed = 3) {
  const rand = rng(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const out = new Array(n).fill(false);
  for (const i of order.slice(0, z)) out[i] = true;
  return out;
}
