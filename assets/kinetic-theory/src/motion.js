// The animation's maths, as pure functions of time (no three.js), so render(t) can jump anywhere and the unit tests
// can check it: easing, windows, molecules bouncing between walls (a reflected straight line, never stepped), when a
// molecule last hit a wall, and "molecule time" that slows down and speeds up without ever jumping.

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
/** Smooth 0…1 between a and b seconds (flat at both ends). */
export function smooth(t, a, b) {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
}
/** 0 before a, rises over `fade` s to 1, stays, falls over `fade` s to 0 at b. */
export function windowed(t, a, b, fade = 0.4) {
  return Math.min(smooth(t, a, a + fade), 1 - smooth(t, b - fade, b));
}

/** A point moving at v from p0, reflected between lo and hi: where it is after time tau. */
export function bounce(p0, v, tau, lo, hi) {
  const L = hi - lo;
  if (!(L > 0)) return lo;
  const u = (((p0 - lo + v * tau) % (2 * L)) + 2 * L) % (2 * L);
  return lo + (u <= L ? u : 2 * L - u);
}

/** The velocity's sign at tau for the same motion (+1 towards hi, −1 towards lo). */
export function bounceDir(p0, v, tau, lo, hi) {
  const L = hi - lo;
  const u = (((p0 - lo + v * tau) % (2 * L)) + 2 * L) % (2 * L);
  return (u < L ? 1 : -1) * Math.sign(v || 1);
}

/**
 * How long ago (in the same time units as tau) the bouncing point last touched `hi`, or Infinity if it has not yet
 * (since tau = 0). It touches hi whenever the unfolded distance p0 − lo + v·tau passes L + 2kL.
 */
export function sinceHitHi(p0, v, tau, lo, hi) {
  const L = hi - lo;
  if (!(L > 0) || v === 0) return Infinity;
  const s = Math.abs(v);
  // unfold so the motion always runs forwards: moving down is the mirror image
  const start = v > 0 ? p0 - lo : 2 * L - (p0 - lo);
  const u = start + s * tau;
  const k = Math.floor((u - L) / (2 * L));
  const uHit = L + 2 * L * k;
  if (uHit < start) return Infinity;
  return (u - uHit) / s;
}

/**
 * Molecule time: the integral of a speed that is 1 before the first key, follows straight lines between keys
 * [[t, rate], …] (in order) and keeps the last rate after them. In closed form, so slowing down, pausing and speeding
 * up never make a jump and seeking is exact.
 */
export function clock(t, keys) {
  if (!keys.length || t <= keys[0][0]) return t;
  let tau = keys[0][0];
  for (let i = 0; i + 1 < keys.length; i++) {
    const [a, ra] = keys[i];
    const [b, rb] = keys[i + 1];
    if (t <= a) return tau;
    const e = Math.min(t, b);
    const d = e - a;
    tau += b > a ? ra * d + ((rb - ra) * d * d) / (2 * (b - a)) : 0;
    if (t <= b) return tau;
  }
  const [last, rate] = keys[keys.length - 1];
  return tau + rate * (t - last);
}

/** The speed of that clock at t. */
export function clockRate(t, keys) {
  if (!keys.length || t <= keys[0][0]) return 1;
  for (let i = 0; i + 1 < keys.length; i++) {
    const [a, ra] = keys[i];
    const [b, rb] = keys[i + 1];
    if (t <= b) return b > a ? ra + ((rb - ra) * (t - a)) / (b - a) : rb;
  }
  return keys[keys.length - 1][1];
}

/** A small seeded random generator (mulberry32), so the molecules start in the same places every time. */
export function random(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The balloon's size (1 = blown up) at time t of the story: blown up from `small`, then (after the needle) the
 * air leaks and it shrinks slowly towards `leaked`; later a new balloon, slightly bigger when the gas is heated.
 */
export function balloonScale(t, k) {
  if (t < k.freshAt) {
    const blown = lerp(k.small, 1, smooth(t, k.inflate[0], k.inflate[1]));
    // leaking: fast at first, slower as the pressure falls
    const u = clamp01((t - k.leak[0]) / (k.leak[1] - k.leak[0]));
    const leaked = 1 - (1 - k.leaked) * (1 - (1 - u) ** 2);
    return t < k.leak[0] ? blown : leaked;
  }
  return lerp(1, k.hot, smooth(t, k.swell[0], k.swell[1]));
}
