// The maths of the figure, pure functions (no 3D, no DOM): the forces of a push between two skaters, what each one
// does because of its own force (a = F/m, the book's F = Ma), and the apple and the Earth of চিত্র ৩.১২.
//
// Two skaters on a smooth floor push each other with the same constant force F for as long as their hands touch: the
// hands move apart by the stroke L (the arms stretch), so each skater moves ½at² and the push lasts until
// ½(a_A + a_B)T² = L. After that nothing pushes them and each glides on at the speed it reached.

export const G = 9.8; // ms⁻²
export const EARTH_MASS = 5.98e24; // kg, the book's M
export const PUSH_FORCE = 10; // N: a gentle, steady push (both skaters get exactly this)
export const STROKE = 0.4; // m: how far the hands move apart during the push (the arms stretch from bent to nearly straight)
export const APPLE_MASS = 1; // kg: the book's "1 kg ভরের বস্তু"
export const APPLE_FALL = 1.4; // m: how far the apple falls in the picture (its centre; not to scale)

/** The pairs of skaters: A (the lighter) and B, masses in kg. */
export const PAIRS = {
  equal: { mA: 50, mB: 50 },
  unequal: { mA: 50, mB: 100 },
};

const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

/** A push of force F between masses mA and mB: accelerations, how long it lasts and the speeds that result. */
export function pushStats(mA, mB, F = PUSH_FORCE, L = STROKE) {
  const aA = F / mA;
  const aB = F / mB;
  const T = Math.sqrt((2 * L) / (aA + aB));
  return { F, aA, aB, T, vA: aA * T, vB: aB * T, sA: 0.5 * aA * T * T, sB: 0.5 * aB * T * T };
}

/**
 * The two skaters t seconds after the push began. Distances are metres away from where each stood (positive: each
 * away from the other). `force` is true only while the hands touch.
 */
export function pushAt(mA, mB, t, F = PUSH_FORCE, L = STROKE) {
  const p = pushStats(mA, mB, F, L);
  const time = Math.max(0, t);
  if (time <= p.T) {
    return {
      phase: time === 0 ? 'rest' : 'push',
      force: time > 0,
      dA: 0.5 * p.aA * time * time,
      dB: 0.5 * p.aB * time * time,
      vA: p.aA * time,
      vB: p.aB * time,
      aA: p.aA,
      aB: p.aB,
      T: p.T,
    };
  }
  const g = time - p.T;
  return { phase: 'glide', force: false, dA: p.sA + p.vA * g, dB: p.sB + p.vB * g, vA: p.vA, vB: p.vB, aA: 0, aB: 0, T: p.T };
}

/** The apple let go from rest: how far it has fallen after t s (free fall, no air), and when it lands. */
export function appleAt(t, height = APPLE_FALL) {
  const tLand = Math.sqrt((2 * height) / G);
  const time = Math.max(0, t);
  if (time >= tLand) return { fallen: height, v: G * tLand, landed: true, tLand };
  return { fallen: 0.5 * G * time * time, v: G * time, landed: false, tLand };
}

/** The Earth's acceleration when a body of mass m is pulled to it with F = mg: a = F/M = (m/M)g (the book's formula). */
export const earthAcceleration = (m = APPLE_MASS, M = EARTH_MASS) => (m / M) * G;

/** A number in scientific form: 1.64e-24 → { mantissa: 1.64, exponent: -24 }. */
export function sci(x, digits = 2) {
  if (!x) return { mantissa: 0, exponent: 0 };
  let exponent = Math.floor(Math.log10(Math.abs(x)));
  let mantissa = round(x / 10 ** exponent, digits);
  if (Math.abs(mantissa) >= 10) {
    mantissa = round(mantissa / 10, digits);
    exponent += 1;
  }
  return { mantissa, exponent };
}

/** How many times the apple's acceleration is the Earth's: M/m. */
export const accelerationRatio = (m = APPLE_MASS, M = EARTH_MASS) => M / m;
