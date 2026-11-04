// The prefix calculator's maths: pure functions, unit-tested (test/unit/si-prefixes.test.mjs).
// A number is kept exact as an integer and a power of ten (value = int × 10^scale, int a BigInt), so changing the
// prefix only moves the decimal point: 0.1 km → cm is exactly 10000, never 9999.999999.

export const MAX_DIGITS = 12; // digits the student can type
export const MAX_EXP_DIGITS = 2; // ×10ⁿ: up to two digits

/** The typed number as an exact value. mant: "2.5", "0.", "" ; exp: null (no ×10ⁿ), "" , "-", "3", "-12". */
export function parseInput(mant, exp = null) {
  const m = String(mant || '');
  const [whole = '', frac = ''] = m.split('.');
  const digits = `${whole}${frac}`.replace(/^0+/, '') || '0';
  let scale = -frac.length;
  const e = exp == null ? 0 : Number.parseInt(exp, 10);
  if (Number.isFinite(e)) scale += e;
  return normalize({ int: BigInt(digits), scale });
}

/** Drop trailing zeros into the power of ten (250000 → 25 × 10⁴); zero is 0 × 10⁰. */
export function normalize({ int, scale }) {
  if (int === 0n) return { int: 0n, scale: 0 };
  let i = int;
  let s = scale;
  while (i % 10n === 0n) {
    i /= 10n;
    s += 1;
  }
  return { int: i, scale: s };
}

/** value × 10^shift, exactly. */
export const shift = (v, by) => normalize({ int: v.int, scale: v.scale + by });

/** from → to: a number in prefix `fromExp` (km: 3) written in prefix `toExp` (cm: −2). */
export const convertValue = (v, fromExp, toExp) => shift(v, fromExp - toExp);

/** Indian / Bangladeshi grouping of an integer string: 1392000 → 13,92,000. */
export function groupIndian(intStr) {
  if (intStr.length <= 3) return intStr;
  const last = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last}`;
}

/**
 * The number written out in full ("2,50,000", "0.0025"), or null when that would be too long to read
 * (more than 13 digits before the point, or more than 9 zeros after it).
 */
export function plain(v, { maxInt = 13, maxZeros = 9 } = {}) {
  if (v.int === 0n) return '0';
  const d = v.int.toString();
  if (v.scale >= 0) {
    if (d.length + v.scale > maxInt) return null;
    return groupIndian(d + '0'.repeat(v.scale));
  }
  const point = d.length + v.scale; // digits before the decimal point
  if (point > 0) {
    if (point > maxInt) return null;
    return `${groupIndian(d.slice(0, point))}.${d.slice(point)}`;
  }
  if (-point > maxZeros) return null;
  return `0.${'0'.repeat(-point)}${d}`;
}

/** a × 10ⁿ with 1 ≤ a < 10: { mant: "2.5", exp: 5 }. Zero is { mant: "0", exp: 0 }. */
export function scientific(v) {
  if (v.int === 0n) return { mant: '0', exp: 0 };
  const d = v.int.toString();
  return { mant: d.length > 1 ? `${d[0]}.${d.slice(1)}` : d, exp: d.length - 1 + v.scale };
}

/** log10 of the value (for "how big is it": the nearest object). */
export function log10(v) {
  if (v.int === 0n) return Number.NEGATIVE_INFINITY;
  const d = v.int.toString();
  return Math.log10(Number(`0.${d.slice(0, 15)}`)) + d.length + v.scale;
}

/**
 * The object in the tour whose size is nearest to `metres` (on a log scale), if one is within `within` powers
 * of ten. sizes: { id: metres }.
 */
export function nearestStop(v, sizes, within = 1.5) {
  const l = log10(v);
  if (!Number.isFinite(l)) return null;
  let best = null;
  for (const [id, m] of Object.entries(sizes)) {
    const d = Math.abs(Math.log10(m) - l);
    if (!best || d < best.d) best = { id, d };
  }
  return best && best.d <= within ? best.id : null;
}

/**
 * One keypress on the calculator. state: { mant, exp } (exp null until ×10ⁿ is pressed). Returns the new state.
 * keys: '0'–'9', '.', 'exp' (×10ⁿ), 'neg' (the power's sign), 'back', 'clear'.
 */
export function press(state, key) {
  const { mant, exp } = state;
  const digitsIn = (s) => s.replace(/\D/g, '').replace(/^0+(?=\d)/, '').length;
  if (key === 'clear') return { mant: '', exp: null };
  if (key === 'back') {
    if (exp != null) return { mant, exp: exp.length ? exp.slice(0, -1) : null };
    return { mant: mant.slice(0, -1), exp };
  }
  if (key === 'exp') {
    if (exp != null) return state;
    return { mant: mant === '' || mant === '.' ? '1' : mant, exp: '' };
  }
  if (key === 'neg') {
    if (exp == null) return state;
    return { mant, exp: exp.startsWith('-') ? exp.slice(1) : `-${exp}` };
  }
  if (key === '.') {
    if (exp != null || mant.includes('.')) return state;
    return { mant: mant === '' ? '0.' : `${mant}.`, exp };
  }
  if (/^\d$/.test(key)) {
    if (exp != null) {
      if (exp.replace('-', '').length >= MAX_EXP_DIGITS) return state;
      const next = `${exp}${key}`.replace(/^(-?)0+(?=\d)/, '$1');
      return { mant, exp: next };
    }
    if (digitsIn(mant) >= MAX_DIGITS && !(mant === '0' || mant === '')) return state;
    if (mant === '0') return { mant: key, exp };
    return { mant: `${mant}${key}`, exp };
  }
  return state;
}
