// The physics of the two waves (book pages 194–195, topic 7.2.2), pure functions, in metres and seconds.
//
// Both media carry the same travelling wave, started at the driven end (x = 0) at t = 0 and moving towards +x:
//   displacement(x, t) = a · ramp(τ) · sin(k x − ω t),  τ = t − x / v  (the time since the wave reached x)
// ramp(τ) eases the driver's amplitude up over its first period, so the wave has a clean front that moves at v and
// nothing ahead of the front moves at all. In the rope (অনুপ্রস্থ) the displacement is sideways (up), at right angles
// to the travel; in the spring (অনুদৈর্ঘ্য) it is along the axis, so the coils crowd (সংকোচন) and spread (প্রসারণ).
// The far end is an absorbing end (a damper over the last TAPER metres) so no reflected wave comes back: the figure
// teaches one wave going one way (reflection is 7.4's subject).

export const WAVE = {
  L: 1.6, // the medium's length between the driver and the far post (m)
  lambda: 0.5, // wavelength (m)
  f: 1.25, // the driver's frequency (Hz)
  aRope: 0.09, // amplitude across the rope (m)
  aSpring: 0.05, // amplitude along the spring (m): a·k ≈ 0.63 < 1, so the 36 mm pitch never closes below 13 mm
  taper: 0.25, // the absorbing end's length (m)
  marked: 0.55, // where the green particle / coil rests (m from the driver)
};
export const MEDIA = ['rope', 'spring'];
export const KIND = { rope: 'transverse', spring: 'longitudinal' };

export const speed = () => WAVE.f * WAVE.lambda; // 0.625 m/s
export const period = () => 1 / WAVE.f;
const omega = () => 2 * Math.PI * WAVE.f;
const kNum = () => (2 * Math.PI) / WAVE.lambda;
export const amplitude = (medium) => (medium === 'spring' ? WAVE.aSpring : WAVE.aRope);

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

/** The driver's amplitude envelope, 0 before the wave arrives, 1 one period later. */
export const ramp = (tau) => smooth(tau / period());
/** The absorbing end: 1 along the medium, easing to 0 at the far post. */
export const endTaper = (x) => 1 - smooth((x - (WAVE.L - WAVE.taper)) / WAVE.taper);

/** Displacement (m) of the particle that rests at x, at time t (s): across for the rope, along for the spring. */
export function displacement(x, t, a) {
  const tau = t - x / speed();
  if (tau <= 0) return 0;
  return a * ramp(tau) * endTaper(x) * Math.sin(kNum() * x - omega() * t);
}

/** Its velocity (m/s), by a central difference (exact enough for directions and arrows). */
export function velocity(x, t, a, h = 1e-4) {
  return (displacement(x, t + h, a) - displacement(x, t - h, a)) / (2 * h);
}

/** How far the wave's front has gone (m), capped at the far end. */
export const front = (t) => Math.max(0, Math.min(WAVE.L, speed() * t));

/** True once the wave has reached x and the driver's ramp is over there (the particle swings fully). */
export const settled = (x, t) => t - x / speed() >= period();

/**
 * Where the spring is most crowded (সংকোচন) and most spread (প্রসারণ) now: rest positions x in [from, to] where
 * cos(kx − ωt) = −1 (compression: ds/dx = a k cos(kx − ωt) most negative) or +1 (rarefaction), only where the wave
 * swings fully. Sorted by x.
 */
export function features(t, { from = 0, to = WAVE.L - WAVE.taper } = {}) {
  const out = [];
  const k = kNum();
  // kx − ωt = π (2n + 1) for a compression, 2πn for a rarefaction → x = (phase + ωt) / k
  const n0 = Math.floor((k * from - omega() * t) / Math.PI - 1);
  const n1 = Math.ceil((k * to - omega() * t) / Math.PI + 1);
  for (let n = n0; n <= n1; n++) {
    const x = (n * Math.PI + omega() * t) / k;
    if (x < from || x > to || !settled(x, t)) continue;
    out.push({ x, kind: ((n % 2) + 2) % 2 === 1 ? 'compression' : 'rarefaction' });
  }
  return out.sort((p, q) => p.x - q.x);
}

/** The feature of a kind nearest to x (or null). */
export function nearest(t, kind, x) {
  let best = null;
  for (const f of features(t)) if (f.kind === kind && (!best || Math.abs(f.x - x) < Math.abs(best.x - x))) best = f;
  return best;
}

/** Which way the marked particle is going now: 'up' | 'down' (rope), 'ahead' | 'back' (spring), 'still'. */
export function heading(medium, t, x = WAVE.marked) {
  const v = velocity(x, t, amplitude(medium));
  if (Math.abs(v) < 0.02) return 'still';
  if (medium === 'spring') return v > 0 ? 'ahead' : 'back';
  return v > 0 ? 'up' : 'down';
}

/** The local spacing of the coils relative to rest: 1 + ds/dx (below 1: crowded, above 1: spread). */
export function spacing(x, t, a, h = 1e-4) {
  return 1 + (displacement(x + h, t, a) - displacement(x - h, t, a)) / (2 * h);
}

export const round = (x, d = 2) => {
  const p = 10 ** d;
  return Math.round(x * p) / p;
};
