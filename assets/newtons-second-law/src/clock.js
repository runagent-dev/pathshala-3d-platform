// The playback clock: how the run's own time (the physics, in s) follows the real time since a push began, so a student
// can watch it. Pure; unit tested in test/unit/newtons-second-law.test.mjs.
//   lead    real s the force and acceleration arrows grow in before the cart moves (the run's clock waits at its start)
//   speed   run s per real s (0.5: half speed; the scene says "সময় ২ গুণ ধীর")
//   stops   run times at which the clock holds for `dwell` real s: each whole second of the measured push, where the
//           velocity is stamped on the floor (a snapshot, as in a stroboscope picture)

export const SLOW = 0.5; // the default speed
export const LEAD = 1.6; // real s for the arrows to grow in (slow only)
export const DWELL = 1.1; // real s held at each whole second (slow only)

/** The settings of a run played at `speed` (1: real time, no lead-in, no holds). */
export const playbackOf = (speed, stops) =>
  speed < 1 ? { speed, lead: LEAD, dwell: DWELL, stops: [...stops].sort((a, b) => a - b) } : { speed: 1, lead: 0, dwell: 0, stops: [] };

/**
 * The run's time `real` s after the clock was set going at run time `from`.
 * Returns { t, grow, held }: t the run's time (s); grow 0…1 how far the arrows have grown in (1 once the lead-in is
 * over); held the stop the clock is holding at (null when it runs).
 * @param {number} real
 * @param {{ speed: number, lead: number, dwell: number, stops: number[], from?: number }} p
 */
export function playTime(real, { speed, lead, dwell, stops, from = 0 }) {
  if (lead > 0 && real < lead) return { t: from, grow: Math.max(0, real / lead), held: null };
  let r = real - lead;
  let t = from;
  for (const stop of stops) {
    if (stop <= from + 1e-9) continue;
    const reach = (stop - t) / speed;
    if (r < reach) return { t: t + r * speed, grow: 1, held: null };
    r -= reach;
    t = stop;
    if (r < dwell) return { t, grow: 1, held: stop };
    r -= dwell;
  }
  return { t: t + r * speed, grow: 1, held: null };
}
