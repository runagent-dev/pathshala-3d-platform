// The maths of the figure, pure functions (unit-tested in test/unit/energy.test.mjs): the hill's shape, the energy of
// the bicycle and its rider, and one small step of each part of the trip. Metres, seconds, kilograms, joules.
// Friction and air resistance are left out, as the figure says: on the way down the total stays the same.

export const MASS = 70; // kg: the rider and the bicycle together
export const G = 9.8; // m/s²
export const HILL = { height: 5, half: 16 }; // m: the top is 5 m above the road; the hill is 32 m from foot to foot
export const START_X = -HILL.half - 1.6; // m: where the bicycle waits on the road, just before the hill
export const CLIMB_SPEED = 3; // m/s while the rider pedals up (about 11 km/h: a brisk climb)
export const CLIMB_ACCEL = 1.2; // m/s²: getting going from rest
export const BRAKE_DECEL = 4; // m/s²: firm braking
export const COAST_MIN = 0.5; // m/s: the slowest crawl over the very top (so it never stalls exactly there)
export const AUTO_BRAKE_X = 150; // m: if nobody brakes, the rider brakes here (the road ends off the picture)

/** Height of the road above the flat road at x (a smooth hump, flat on both sides). */
export function heightAt(x, { height, half } = HILL) {
  if (Math.abs(x) >= half) return 0;
  return (height * (1 + Math.cos((Math.PI * x) / half))) / 2;
}

/** The road's slope dy/dx at x. */
export function slopeAt(x, { height, half } = HILL) {
  if (Math.abs(x) >= half) return 0;
  return (-height * Math.PI * Math.sin((Math.PI * x) / half)) / (2 * half);
}

export const potential = (y, m = MASS) => m * G * y; // বিভব শক্তি, J
export const kinetic = (v, m = MASS) => 0.5 * m * v * v; // গতিশক্তি, J
export const TOTAL = potential(HILL.height); // J at the top: 3430

/** Speed after rolling freely from rest at the top down to height y (no friction): ½mv² = mg(H − y). */
export const speedAt = (y, top = HILL.height) => Math.sqrt(Math.max(0, 2 * G * (top - y)));

/** The x on the way up (x < 0) or down (x > 0) where the road is at height y. */
export function xAtHeight(y, side = 1, { height, half } = HILL) {
  const k = Math.min(1, Math.max(0, y / height));
  return (side * half * Math.acos(2 * k - 1)) / Math.PI;
}

/** Move a distance ds along the road from x (the road's length, not its x). */
export function advance(x, ds) {
  // a few small steps, each along the local tangent
  const n = Math.max(1, Math.ceil(Math.abs(ds) / 0.05));
  let p = x;
  for (let i = 0; i < n; i++) p += ds / n / Math.sqrt(1 + slopeAt(p) ** 2);
  return p;
}

/**
 * One step of the trip. s = { phase, x, v, heat }; returns a new state.
 * - climb: the rider pedals: gets going, rides steadily, and near the top stops pedalling and coasts to the top;
 * - roll: no pedalling, no friction: v from ½mv² = mg(H − y); on the flat road it keeps its speed (flat);
 * - brake: a steady braking force; the energy it takes away is counted as heat.
 */
export function step(s, dt) {
  const n = { ...s };
  if (s.phase === 'climb') {
    const y = heightAt(s.x);
    const coastFrom = HILL.height - (CLIMB_SPEED * CLIMB_SPEED) / (2 * G); // from here the speed it has carries it up
    n.v = y < coastFrom ? Math.min(CLIMB_SPEED, s.v + CLIMB_ACCEL * dt) : Math.max(COAST_MIN, Math.min(s.v, speedAt(y)));
    n.x = advance(s.x, n.v * dt);
    if (n.x >= 0) Object.assign(n, { x: 0, v: 0, phase: 'top' });
  } else if (s.phase === 'roll' || s.phase === 'flat') {
    n.x = advance(s.x, Math.max(COAST_MIN, s.v) * dt);
    n.v = Math.max(COAST_MIN, speedAt(heightAt(n.x)));
    if (n.x >= HILL.half) {
      n.phase = 'flat';
      n.v = speedAt(0);
    }
    if (n.x >= AUTO_BRAKE_X) n.phase = 'brake';
  } else if (s.phase === 'brake') {
    const v = Math.max(0, s.v - BRAKE_DECEL * dt);
    n.x = advance(s.x, ((s.v + v) / 2) * dt);
    n.heat = s.heat + kinetic(s.v) - kinetic(v);
    n.v = v;
    if (v === 0) n.phase = 'stopped';
  }
  return n;
}

/**
 * The energy the panel shows, in J: potential (height), kinetic (motion), their total, the heat the brakes took and
 * the work the rider has done. While climbing, the rider's work is what the bicycle has (nothing is lost); the tiny
 * crawl over the top is not counted beyond the total at the top.
 */
export function energyOf({ phase, x, v, heat = 0 }) {
  const y = heightAt(x);
  const pe = potential(y);
  let ke = kinetic(v);
  if (phase === 'climb' || phase === 'roll') ke = Math.min(ke, Math.max(0, TOTAL - pe));
  if (phase === 'roll' || phase === 'flat') ke = TOTAL - pe; // exactly what was lost in height
  const work = phase === 'start' ? 0 : phase === 'climb' ? pe + ke : TOTAL;
  return { potential: pe, kinetic: ke, total: pe + ke, heat, work, height: y };
}

/** A whole number of joules, rounded to tens, grouped the Bangladeshi way (৩,৪৩০; ১২,৩৪,৫৬০). */
export function groupJ(j) {
  const n = String(Math.round(Math.max(0, j) / 10) * 10);
  if (n.length <= 3) return n;
  const last = n.slice(-3);
  let rest = n.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last}`;
}

/** Height or speed for a sentence: one decimal, no trailing zero (৩.২, ৫). */
export const fmt1 = (x) => String(Math.round(x * 10) / 10);
