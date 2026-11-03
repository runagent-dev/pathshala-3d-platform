// The echo's arithmetic (book page 201, topic 7.3.1), pure functions: the sound goes to the cliff and back (2d) at
// 330 m/s; the ear keeps a sound for 0.1 s, so the echo is heard on its own only if it returns at least 0.1 s after
// the clap: 2d ≥ 330 m/s × 0.1 s = 33 m, d ≥ 16.5 m.

/** The speed of sound in air, as the book's echo paragraph takes it (m/s). */
export const V_SOUND = 330;
/** How long a sound stays with us (s): two sounds closer than this merge. */
export const GAP = 0.1;
/** The distance sound covers in 0.1 s (m): 33 m. */
export const GAP_PATH = round(V_SOUND * GAP, 6);
/** The least distance from the wall for a separate echo (m): 16.5 m. */
export const MIN_D = GAP_PATH / 2;
/** The listener's range (m) and the step of a drag or a key. */
export const D_MIN = 4;
export const D_MAX = 40;
export const D_STEP = 0.5;
/** The examples in the panel (m). */
export const EXAMPLES = [5, 10, 20, 35];
/** The picture is slowed this many times (the real trip at 40 m takes only 0.24 s). */
export const SLOW = 20;

export function round(x, digits = 0) {
  const k = 10 ** digits;
  return Math.round((x + Math.sign(x) * Number.EPSILON) * k) / k;
}

/** A distance kept in the range and on the 0.5 m steps. */
export function snapD(d) {
  const v = Math.min(D_MAX, Math.max(D_MIN, Number(d) || 0));
  return round(Math.round(v / D_STEP) * D_STEP, 1);
}

/** The time the clap takes to reach the wall and come back (s): t = 2d ÷ v. */
export const echoTime = (d, v = V_SOUND) => (2 * d) / v;
/** The distance of the wall from the time of the echo (m): d = v t ÷ 2. */
export const distanceFromTime = (t, v = V_SOUND) => (v * t) / 2;
/** Whether the echo is heard on its own (the book: at least 0.1 s, at least 16.5 m). */
export const separate = (d) => echoTime(d) >= GAP - 1e-9;

/** The time shown in the panel: three decimals, and whether that is rounded (then the panel writes ≈). */
export function shownTime(d) {
  const t = echoTime(d);
  const r = round(t, 3);
  return { t, shown: r, exact: Math.abs(r - t) < 1e-9 };
}

/**
 * Where the pulse is at time τ (s of real time after the clap) for a listener d m from the wall: the outgoing front's
 * radius (m from the hands), the echo's radius (m from the image of the hands behind the wall; 0 until the clap reaches
 * the wall), and the phase: 'out' | 'back' | 'done'.
 */
export function pulseAt(d, tau) {
  const r = Math.max(0, V_SOUND * tau);
  return { out: r, back: r > d ? r : 0, phase: r < d ? 'out' : r < 2 * d ? 'back' : 'done' };
}

/**
 * The four answers to "is the echo heard on its own at d m?": the right one, the opposite verdict with the right time
 * (the 0.1 s rule misread), the verdict from the one-way time (forgot the way back), and "at any distance".
 * Each: { key, yes, t } (t: s, or null).
 */
export function hearChoices(d) {
  const t = round(echoTime(d), 3);
  const oneWay = round(d / V_SOUND, 3);
  const yes = separate(d);
  return [
    { key: 'right', yes, t },
    { key: 'flip', yes: !yes, t },
    { key: 'oneway', yes: oneWay >= GAP, t: oneWay },
    { key: 'any', yes: true, t: null },
  ];
}

/** The four answers to "the echo came back after t s: how far is the wall?": right, not halved, 0.1 s's 16.5 m, v ÷ t. */
export function distanceChoices(t) {
  const d = round(distanceFromTime(t), 2);
  const list = [
    { key: 'right', d },
    { key: 'whole', d: round(V_SOUND * t, 2) },
    { key: 'gap', d: MIN_D },
    { key: 'divide', d: round(V_SOUND / t / 2, 2) },
  ];
  return list;
}
