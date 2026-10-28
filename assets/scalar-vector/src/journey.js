// A smooth 120 m walk with endpoints 20 m apart, north/south. Sampling and all readings are independent of Three.
const CONTROLS = [
  [-18, -14],
  [-8, -20],
  [12, -18],
  [20, -5],
  [9, 2],
  [16, 12],
  [6, 21],
  [-8, 20],
  [-18, 14],
].map(([x, y]) => [x, (y * 5) / 7]);
const START = CONTROLS[0];
const FINISH = CONTROLS.at(-1);
const TARGET_LENGTH = 120;

function samples(spread) {
  const controls = CONTROLS.map(([x, y]) => [START[0] + (x - START[0]) * spread, y]);
  const points = [];
  for (let i = 0; i < controls.length - 1; i++) {
    const p = [controls[Math.max(0, i - 1)], controls[i], controls[i + 1], controls[Math.min(controls.length - 1, i + 2)]];
    for (let j = 0; j < 48; j++) {
      const u = j / 48;
      points.push(
        [0, 1].map(
          (axis) =>
            0.5 *
            (2 * p[1][axis] +
              (-p[0][axis] + p[2][axis]) * u +
              (2 * p[0][axis] - 5 * p[1][axis] + 4 * p[2][axis] - p[3][axis]) * u * u +
              (-p[0][axis] + 3 * p[1][axis] - 3 * p[2][axis] + p[3][axis]) * u * u * u),
        ),
      );
    }
  }
  return [...points, FINISH];
}

export function cumulativeLengths(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return lengths;
}

function makeJourney() {
  let lo = 0;
  let hi = 2;
  for (let i = 0; i < 45; i++) {
    const mid = (lo + hi) / 2;
    if (cumulativeLengths(samples(mid)).at(-1) < TARGET_LENGTH) lo = mid;
    else hi = mid;
  }
  const points = samples((lo + hi) / 2);
  const lengths = cumulativeLengths(points);
  return { points, lengths, length: lengths.at(-1), start: START, finish: FINISH, magnitude: 20, direction: 'n' };
}

export const JOURNEY = makeJourney();

/** Fraction of travelled distance, rather than fraction of control points (so walking speed is steady). */
export function pointAt(fraction) {
  const d = Math.max(0, Math.min(1, fraction)) * JOURNEY.length;
  let lo = 0;
  let hi = JOURNEY.lengths.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (JOURNEY.lengths[mid] < d) lo = mid;
    else hi = mid;
  }
  const k = (d - JOURNEY.lengths[lo]) / (JOURNEY.lengths[hi] - JOURNEY.lengths[lo] || 1);
  return JOURNEY.points[lo].map((value, axis) => value + (JOURNEY.points[hi][axis] - value) * k);
}
