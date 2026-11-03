// The physics of the rope wave (book pages 195–197, topic 7.2.3), kept apart from the 3D so it can be unit-tested.
// A transverse wave runs along a stretched rope from a wave driver at x = 0: y(x, t) = a cos(kx − ωt), k = 2π/λ,
// ω = 2πf. At t = 0 (and every whole period after) a crest sits at the driver. The speed is the rope's (the
// medium's): v = fλ, so the same rope at twice the frequency carries half the wavelength.

export const A = 0.1; // m: the amplitude (বিস্তার), the book's 7.06 and 7.08
export const LENGTH = 2; // m: the measured part of the rope (the board's scale, 0–2 m)
export const XP = 1.6; // m: the marked particle (a green bead tied on the rope)
export const SLOW = 10; // the picture runs 10 times slower than real time
export const WINDOW = 0.8; // s: the displacement–time graph's time axis (a whole number of periods for every example)

/** The ropes (the media): their wave speed (m/s). */
export const ROPES = {
  light: { v: 5, radius: 0.0075 },
  heavy: { v: 2.5, radius: 0.013 },
};

/** The examples, in the row of words: the book's 7.08 (5 Hz, 1 m, 5 m/s) first. */
export const EXAMPLES = [
  { id: 'f5', rope: 'light', f: 5 },
  { id: 'f10', rope: 'light', f: 10 },
  { id: 'f2', rope: 'light', f: 2.5 },
  { id: 'heavy', rope: 'heavy', f: 5 },
];

export const round = (x, d = 2) => +(Math.round(x * 10 ** d) / 10 ** d).toFixed(d);

/** One example's quantities: a, f, T, v, λ, k, ω. */
export function quantities(id) {
  const ex = EXAMPLES.find((e) => e.id === id) || EXAMPLES[0];
  const v = ROPES[ex.rope].v;
  const f = ex.f;
  const lambda = v / f;
  return { id: ex.id, rope: ex.rope, a: A, f, T: 1 / f, v, lambda, k: (2 * Math.PI) / lambda, w: 2 * Math.PI * f };
}

/** The displacement (m) at x (m) and time t (s). */
export const displacement = (q, x, t) => q.a * Math.cos(q.k * x - q.w * t);
/** The rope's slope dy/dx. */
export const slope = (q, x, t) => -q.a * q.k * Math.sin(q.k * x - q.w * t);

/** How far (m) a crest has gone in time t: v t. */
export const travelled = (q, t) => q.v * t;

/** The next whole period at or after t (s), within a small tolerance. */
export function nextPeriod(q, t) {
  const n = Math.ceil(t / q.T - 1e-6);
  return n * q.T;
}
/** Whether t (s) is a whole number of periods. */
export const atWholePeriod = (q, t) => Math.abs(t / q.T - Math.round(t / q.T)) < 1e-6;

/**
 * Where to mark λ and a at time t: an extreme (a crest, or a trough if no crest leaves room) at `start` with the
 * same phase again at start + λ, and the opposite extreme half way between, for the amplitude.
 * Returns { start, end, crest: true if start is a crest, mid, midCrest }.
 */
export function markers(q, t, length = LENGTH) {
  // crests where kx − ωt = 2πn → x = (ωt + 2πn)/k = vt + nλ; troughs half a wavelength on
  const crest0 = (((q.v * t) % q.lambda) + q.lambda) % q.lambda;
  const fits = (s) => s >= -1e-9 && s + q.lambda <= length + 1e-9;
  let start = crest0 < 1e-9 || q.lambda - crest0 < 1e-9 ? 0 : crest0;
  let crest = true;
  if (!fits(start)) {
    start = (crest0 + q.lambda / 2) % q.lambda;
    crest = false;
  }
  if (!fits(start)) return null;
  return { start, end: start + q.lambda, crest, mid: start + q.lambda / 2, midCrest: !crest };
}

/**
 * Where to mark the amplitude at time t: a crest (else a trough) on the board, away from the driver and from the ends
 * of the λ mark. Returns { x, up } or null.
 */
export function ampMark(q, t, length = LENGTH) {
  const mk = markers(q, t, length);
  const away = (x) => !mk || (Math.abs(x - mk.start) > 0.05 && Math.abs(x - mk.end) > 0.05);
  const crest0 = (((q.v * t) % q.lambda) + q.lambda) % q.lambda;
  const list = [];
  for (let i = 0; ; i++) {
    const x = crest0 - q.lambda + (i * q.lambda) / 2;
    if (x > length) break;
    const up = i % 2 === 0;
    if (x >= 0.15 && x <= length - 0.1 && away(x)) list.push({ x, up });
  }
  return list.find((c) => c.up) || list[0] || null;
}

/** How many whole wavelengths fit on the board. */
export const wavesOnRope = (q, length = LENGTH) => length / q.lambda;

// ── the test ──────────────────────────────────────────────────────────────────

/** Choices for "what is λ?": the right one first, then the usual mistakes, each with its key. */
export function lambdaChoices(q) {
  return uniq([
    { key: 'right', v: q.lambda },
    { key: 'half', v: q.lambda / 2 }, // crest to trough
    { key: 'double', v: q.lambda * 2 },
    { key: 'amp', v: q.a }, // the height, not the length
  ]);
}
/** Choices for "what is a?". */
export function ampChoices(q) {
  return uniq([
    { key: 'right', v: q.a },
    { key: 'p2p', v: 2 * q.a }, // crest to trough
    { key: 'half', v: q.a / 2 },
    { key: 'lambda', v: q.lambda },
  ]);
}
/** Choices for "what is v?" from f on the generator and λ on the board. */
export function speedChoices(q) {
  return uniq([
    { key: 'right', v: q.v },
    { key: 'f_over_l', v: q.f / q.lambda },
    { key: 'l_over_f', v: q.lambda / q.f },
    { key: 'sum', v: q.f + q.lambda },
  ]);
}

function uniq(list) {
  const seen = new Set();
  return list.filter((c) => {
    const k = round(c.v, 4);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * As the book's 7.09: five points on the 0.5 m wave (10 Hz) at t = 0: A and C crests one λ apart (the same phase),
 * B a trough (opposite), D and E at the same displacement (−a/2) but not in the same phase.
 */
export const PHASE_EXAMPLE = 'f10';
export const PHASE_POINTS = [
  { id: 'A', x: 0.5 },
  { id: 'B', x: 0.75 },
  { id: 'C', x: 1 },
  { id: 'D', x: 1 + 0.5 / 3 },
  { id: 'E', x: 1 + 1 / 3 },
];
/** The phase (0…2π) of the wave at x, t. */
export function phase(q, x, t) {
  const p = (q.k * x - q.w * t) % (2 * Math.PI);
  return p < 0 ? p + 2 * Math.PI : p;
}
