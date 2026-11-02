// Water molecules in the three states, as the book's চিত্র ৫.১৩ draws them, in lens units: the magnifier is a circle of
// radius 1 around (0, 0), y up. Each molecule is { x, y, a }: where it is and which way its two hydrogens point.
// The solid is a pure function of time; the liquid and the gas are simulated once, with a fixed seed, and sampled, so
// the animation still draws the same picture for the same time however it got there (seek, loop, video frames).

/** The drawn water molecule: oxygen and hydrogen radii, the O–H distance and the H–O–H angle (104.5°). */
export const MOL = { o: 0.106, h: 0.065, oh: 0.106, angle: (104.5 * Math.PI) / 180 };
/** Lattice spacing of the solid and the wall the molecules stay inside (a molecule's radius in from the rim). */
export const SPACING = 0.25;
export const WALL = 1 - 0.115;

/** Small seeded random numbers (mulberry32), the same on every machine. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand) {
  const u = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** Where the three atoms of a molecule are drawn (lens units): O, H, H. */
export function atoms(m, scale = 1) {
  const { o, h, oh, angle } = MOL;
  const back = 0.28 * oh * scale; // the oxygen sits a little behind the centre, so the molecule looks centred
  const ox = m.x - Math.cos(m.a) * back;
  const oy = m.y - Math.sin(m.a) * back;
  const half = angle / 2;
  const d = oh * scale;
  return [
    { x: ox, y: oy, r: o * scale },
    { x: ox + Math.cos(m.a + half) * d, y: oy + Math.sin(m.a + half) * d, r: h * scale },
    { x: ox + Math.cos(m.a - half) * d, y: oy + Math.sin(m.a - half) * d, r: h * scale },
  ];
}

/** The solid: a close, regular (hexagonal) pattern filling the lens, every molecule turned the same way. */
export function lattice(spacing = SPACING, radius = WALL - 0.005) {
  const sites = [];
  const dy = (spacing * Math.sqrt(3)) / 2;
  const rows = Math.ceil(radius / dy);
  const cols = Math.ceil(radius / spacing) + 1;
  for (let j = -rows; j <= rows; j++) {
    const shift = j & 1 ? spacing / 2 : 0;
    for (let i = -cols; i <= cols; i++) {
      const x = i * spacing + shift;
      const y = j * dy;
      if (Math.hypot(x, y) <= radius) sites.push({ x, y, a: Math.PI / 2 });
    }
  }
  return sites;
}

/** The solid at time t: each molecule only vibrates (কাঁপে) about its own place. Amplitude in lens units. */
export function createSolid(sites, { amplitude = 0.02, seed = 3 } = {}) {
  const rand = rng(seed);
  const waves = sites.map(() => ({
    wx: 2 * Math.PI * (1.6 + rand() * 0.9),
    wy: 2 * Math.PI * (1.6 + rand() * 0.9),
    wa: 2 * Math.PI * (0.8 + rand() * 0.6),
    px: rand() * 2 * Math.PI,
    py: rand() * 2 * Math.PI,
    pa: rand() * 2 * Math.PI,
  }));
  return function at(t, out = sites.map(() => ({ x: 0, y: 0, a: 0 })), gain = 1) {
    const A = amplitude * gain;
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      const w = waves[i];
      out[i].x = s.x + A * Math.sin(w.wx * t + w.px);
      out[i].y = s.y + A * Math.sin(w.wy * t + w.py);
      out[i].a = s.a + 0.14 * gain * Math.sin(w.wa * t + w.pa);
    }
    return out;
  };
}

/**
 * The liquid: the same molecules, started on their lattice places and tied to them by springs that let go as the ice
 * melts (tether(t) → 0), jostled by heat (temp(t)), pushing each other apart when they touch and kept inside the lens.
 * Simulated from t0 to t1 and stored at `rate` frames a second.
 */
export function simulateLiquid({ sites, t0, t1, tether, temp, rate = 30, sub = 4, seed = 7, diameter = 0.215 }) {
  const n = sites.length;
  const rand = rng(seed);
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const a = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const va = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = sites[i].x;
    y[i] = sites[i].y;
    a[i] = sites[i].a;
  }
  const K = 1400; // contact stiffness
  const KW = 1500; // the lens wall
  const GAMMA = 3; // friction of the heat bath
  const INERTIA = 0.02;
  const d2 = diameter * diameter;
  const frames = Math.floor((t1 - t0) * rate) + 1;
  const data = new Float32Array(frames * n * 3);
  const dt = 1 / (rate * sub);
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);
  const store = (f) => {
    const o = f * n * 3;
    for (let i = 0; i < n; i++) {
      data[o + i * 3] = x[i];
      data[o + i * 3 + 1] = y[i];
      data[o + i * 3 + 2] = a[i];
    }
  };
  store(0);
  for (let f = 1; f < frames; f++) {
    for (let s = 0; s < sub; s++) {
      const time = t0 + ((f - 1) * sub + s) * dt;
      const k = tether(time);
      const T = temp(time);
      const kick = Math.sqrt(2 * GAMMA * T * dt);
      const kickA = Math.sqrt((2 * GAMMA * T * dt) / INERTIA);
      fx.fill(0);
      fy.fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[i] - x[j];
          const dy = y[i] - y[j];
          const r2 = dx * dx + dy * dy;
          if (r2 >= d2 || r2 === 0) continue;
          const r = Math.sqrt(r2);
          const push = (K * (diameter - r)) / r;
          fx[i] += dx * push;
          fy[i] += dy * push;
          fx[j] -= dx * push;
          fy[j] -= dy * push;
        }
        const r = Math.hypot(x[i], y[i]);
        if (r > WALL) {
          const pull = (KW * (r - WALL)) / r;
          fx[i] -= x[i] * pull;
          fy[i] -= y[i] * pull;
        }
        if (k > 0) {
          fx[i] -= k * (x[i] - sites[i].x);
          fy[i] -= k * (y[i] - sites[i].y);
        }
      }
      for (let i = 0; i < n; i++) {
        vx[i] += (fx[i] - GAMMA * vx[i]) * dt + kick * gaussian(rand);
        vy[i] += (fy[i] - GAMMA * vy[i]) * dt + kick * gaussian(rand);
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        const ta = k > 0 ? -0.02 * k * (a[i] - sites[i].a) : 0;
        va[i] += (ta / INERTIA - GAMMA * va[i]) * dt + kickA * gaussian(rand);
        a[i] += va[i] * dt;
      }
    }
    store(f);
  }
  return { t0, rate, n, frames, data };
}

/**
 * The gas: a few molecules far apart, flying straight and fast, bouncing off each other and the lens wall without
 * losing speed (মুক্তভাবে ছোটাছুটি). Each also spins. Simulated from t0 to t1, stored at `rate` frames a second.
 */
export function simulateGas({ n = 10, t0, t1, speed = 1.7, rate = 60, sub = 8, seed = 11, diameter = 0.215 }) {
  const rand = rng(seed);
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const a = new Float64Array(n);
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // far apart from the start: try places until one is clear of the others
    for (let tries = 0; tries < 400; tries++) {
      const r = Math.sqrt(rand()) * (WALL - 0.05);
      const th = rand() * 2 * Math.PI;
      const px = r * Math.cos(th);
      const py = r * Math.sin(th);
      let ok = true;
      for (let j = 0; j < i; j++) if (Math.hypot(px - x[j], py - y[j]) < 0.42) ok = false;
      x[i] = px;
      y[i] = py;
      if (ok) break;
    }
    const th = rand() * 2 * Math.PI;
    const v = speed * (0.75 + rand() * 0.5);
    vx[i] = v * Math.cos(th);
    vy[i] = v * Math.sin(th);
    a[i] = rand() * 2 * Math.PI;
    w[i] = (rand() < 0.5 ? -1 : 1) * (2 + rand() * 3);
  }
  const frames = Math.floor((t1 - t0) * rate) + 1;
  const data = new Float32Array(frames * n * 3);
  const dt = 1 / (rate * sub);
  const store = (f) => {
    const o = f * n * 3;
    for (let i = 0; i < n; i++) {
      data[o + i * 3] = x[i];
      data[o + i * 3 + 1] = y[i];
      data[o + i * 3 + 2] = a[i];
    }
  };
  store(0);
  for (let f = 1; f < frames; f++) {
    for (let s = 0; s < sub; s++) {
      for (let i = 0; i < n; i++) {
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        a[i] += w[i] * dt;
        const r = Math.hypot(x[i], y[i]);
        if (r > WALL) {
          // a mirror bounce off the round wall, same speed
          const nx = x[i] / r;
          const ny = y[i] / r;
          const vn = vx[i] * nx + vy[i] * ny;
          if (vn > 0) {
            vx[i] -= 2 * vn * nx;
            vy[i] -= 2 * vn * ny;
          }
          x[i] = nx * WALL;
          y[i] = ny * WALL;
        }
      }
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const dx = x[j] - x[i];
          const dy = y[j] - y[i];
          const r = Math.hypot(dx, dy);
          if (r >= diameter || r === 0) continue;
          const nx = dx / r;
          const ny = dy / r;
          const vn = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
          if (vn >= 0) continue; // already moving apart
          // equal masses, elastic: swap the speeds along the line between them
          vx[i] += vn * nx;
          vy[i] += vn * ny;
          vx[j] -= vn * nx;
          vy[j] -= vn * ny;
        }
    }
    store(f);
  }
  return { t0, rate, n, frames, data };
}

/** The molecules of a simulation at time t (between its stored frames, by straight-line blending). */
export function sample(sim, t, out = Array.from({ length: sim.n }, () => ({ x: 0, y: 0, a: 0 }))) {
  const f = Math.min(sim.frames - 1, Math.max(0, (t - sim.t0) * sim.rate));
  const i0 = Math.floor(f);
  const i1 = Math.min(sim.frames - 1, i0 + 1);
  const u = f - i0;
  const d = sim.data;
  for (let i = 0; i < sim.n; i++) {
    const p = i0 * sim.n * 3 + i * 3;
    const q = i1 * sim.n * 3 + i * 3;
    out[i].x = d[p] + (d[q] - d[p]) * u;
    out[i].y = d[p + 1] + (d[q + 1] - d[p + 1]) * u;
    out[i].a = d[p + 2] + (d[q + 2] - d[p + 2]) * u;
  }
  return out;
}

/** The smallest distance between two molecules' centres (for the tests: close in a solid, far apart in a gas). */
export function nearest(ms) {
  let best = Infinity;
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) best = Math.min(best, Math.hypot(ms[i].x - ms[j].x, ms[i].y - ms[j].y));
  return best;
}
