// The echo's arithmetic (book page 201, topic 7.3.1), pure functions: the sound goes to the cliff and back (2d) at
// 330 m/s; the ear keeps a sound for 0.1 s, so the echo is heard on its own only if it starts at least 0.1 s after the
// call starts: 2d ≥ 330 m/s × 0.1 s = 33 m, d ≥ 16.5 m. The moments compared are the two STARTS: the call is a word,
// longer than 0.1 s, and the echo is the same word arriving again 2d ÷ 330 s later.

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
/** How long the call lasts (s): a two-syllable word called out; the echo lasts as long. */
export const CALL = 0.35;

export function round(x, digits = 0) {
  const k = 10 ** digits;
  return Math.round((x + Math.sign(x) * Number.EPSILON) * k) / k;
}

/** A distance kept in the range and on the 0.5 m steps. */
export function snapD(d) {
  const v = Math.min(D_MAX, Math.max(D_MIN, Number(d) || 0));
  return round(Math.round(v / D_STEP) * D_STEP, 1);
}

/** The time from the call's start to its echo's start (s): the way to the wall and back, t = 2d ÷ v. */
export const echoTime = (d, v = V_SOUND) => (2 * d) / v;
/** The distance of the wall from the time of the echo (m): d = v t ÷ 2. */
export const distanceFromTime = (t, v = V_SOUND) => (v * t) / 2;
/** Whether the echo is heard on its own (the book: at least 0.1 s, at least 16.5 m). */
export const separate = (d) => echoTime(d) >= GAP - 1e-9;

/** The call and its echo on the time line (s): the same length, the echo starting 2d ÷ v later. */
export const callBar = () => ({ start: 0, end: CALL });
export const echoBar = (d) => ({ start: echoTime(d), end: echoTime(d) + CALL });
/** Whether the echo's start reaches the ear before the word has ended. */
export const startsDuringCall = (d) => echoTime(d) < CALL;

/** The time shown in the panel: three decimals, and whether that is rounded (then the panel writes ≈). */
export function shownTime(d) {
  const t = echoTime(d);
  const r = round(t, 3);
  return { t, shown: r, exact: Math.abs(r - t) < 1e-9 };
}

/**
 * Where the sound's front is at time τ (s of real time after the call starts) for a student d m from the wall: the
 * outgoing front's radius (m from the mouth), the echo's radius (m from the image of the mouth behind the wall; 0 until
 * the sound reaches the wall), and the phase: 'out' | 'back' | 'done'.
 */
export function pulseAt(d, tau) {
  const r = Math.max(0, V_SOUND * tau);
  return { out: r, back: r > d ? r : 0, phase: r < d ? 'out' : r < 2 * d ? 'back' : 'done' };
}

/**
 * The four answers to "is the echo heard on its own at d m?", each a verdict with a reason about the echo's time:
 * yes/no × "it comes back after 0.1 s" / "before 0.1 s". One is right; 'flip' keeps the true time but turns the rule
 * round; 'time' has the time wrong (the verdict follows from it); 'reason' has the right verdict with a false reason.
 * Each: { key, yes, after } (after: the reason says the echo starts 0.1 s or more after the call starts).
 */
export function hearChoices(d) {
  const after = separate(d);
  return [
    { key: 'right', yes: after, after },
    { key: 'flip', yes: !after, after },
    { key: 'time', yes: !after, after: !after },
    { key: 'reason', yes: after, after: !after },
  ];
}

/** The times the test's "how far is the cliff?" uses (s): every slip below gives a different distance. */
export const FAR_TIMES = [0.16, 0.18, 0.22, 0.24];

/**
 * The four answers to "the echo came back after t s: how far is the cliff?": right (v t ÷ 2), not halved (v t), halved
 * twice (v t ÷ 4), and the book's 16.5 m (the least distance, not this cliff's).
 */
export function distanceChoices(t) {
  return [
    { key: 'right', d: round(distanceFromTime(t), 2) },
    { key: 'whole', d: round(V_SOUND * t, 2) },
    { key: 'quarter', d: round((V_SOUND * t) / 4, 2) },
    { key: 'gap', d: MIN_D },
  ];
}
