// The maths of the stopwatch reading, kept apart from the 3D so it can be unit-tested. The display shows
// minutes:seconds and, smaller, hundredths of a second: "3:11 12" is 3 minutes 11.12 seconds = 191.12 s.
// The least count (ন্যূনাঙ্ক) is 0.01 s.

export const LC = 0.01; // s
export const MAX = 3600 - LC; // the display goes up to 59:59 99

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** Whole minutes, seconds (with hundredths) and hundredths for a time in seconds, cut (not rounded) to 0.01 s. */
export function split(seconds) {
  const cs = Math.floor(Math.min(MAX, Math.max(0, seconds)) * 100 + 1e-6);
  const min = Math.floor(cs / 6000);
  const rest = cs - min * 6000;
  return { min, sec: rest / 100, whole: Math.floor(rest / 100), cs: rest % 100, value: cs / 100 };
}

const two = (n) => String(n).padStart(2, '0');

/** The display: big "M:SS" and small "CC"; `text` is the same written as in a book, "3:11.12". */
export function format(seconds) {
  const r = split(seconds);
  const main = `${r.min}:${two(r.whole)}`;
  return { main, small: two(r.cs), text: `${main}.${two(r.cs)}`, ...r };
}

/** Seconds as written in the book, with two decimals: "191.12". */
export const fmtS = (seconds) => roundTo(seconds, LC).toFixed(2);

/** minutes × 60 + seconds. */
export const toSeconds = (min, sec) => roundTo(min * 60 + sec, LC);
