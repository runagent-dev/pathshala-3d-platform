// Pure measurement maths for a vernier caliper. No three.js here, so it is easy to test.
//
// A vernier with n divisions spans (n − 1) main-scale millimetres, so
//   1 VSD = (n − 1)/n mm   and   least count LC = 1 MSD − 1 VSD = 1/n mm.

export const LEAST_COUNTS = [0.1, 0.05, 0.02];

export const divisionsFor = (lc) => Math.round(1 / lc);

/**
 * Reading shown by the scales when the vernier zero sits at `zeroPos` mm on the main scale.
 * The vernier line that coincides is the one closest to a main-scale line, which is the same as
 * rounding to the nearest least count.
 */
export function readScales(zeroPos, lc) {
  const n = divisionsFor(lc);
  const counts = Math.round(zeroPos * n + 1e-9);
  const msr = Math.floor(counts / n); // main-scale mark at or just before the vernier zero (mm)
  const vsr = counts - msr * n; // coinciding vernier division, 0 … n−1
  return {
    n,
    lc,
    msr,
    vsr,
    numeral: (vsr * 10) / n, // the printed vernier number at that line (each numeral = 0.1 mm)
    value: counts / n,
    coincideMain: msr + vsr, // main-scale mark (mm) that lines up with vernier line `vsr`
    // How far the nearest vernier line is from perfect alignment (mm). 0 when snapped.
    misalignment: zeroPos - counts / n,
  };
}

/**
 * Everything the UI shows for a jaw gap (true size) and a zero error.
 * Observed reading = size + zeroError; corrected reading = observed − zeroError.
 */
export function measure(gap, lc, zeroError = 0) {
  const r = readScales(gap + zeroError, lc);
  const ze = roundTo(zeroError, lc);
  return { ...r, gap, zeroError: ze, observed: r.value, corrected: roundTo(r.value - ze, lc) };
}

export function roundTo(x, step) {
  return Math.round(x / step + (x >= 0 ? 1e-9 : -1e-9)) * step;
}

export function decimalsFor(lc, unit = 'mm') {
  const mm = lc >= 0.1 ? 1 : 2;
  return unit === 'cm' ? mm + 1 : mm;
}

/** Format a millimetre value in mm or cm with the right number of decimals for the least count. */
export function format(mm, lc, unit = 'mm') {
  const v = unit === 'cm' ? mm / 10 : mm;
  const d = decimalsFor(lc, unit);
  const s = (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
  return s === `-${(0).toFixed(d)}` ? (0).toFixed(d) : s;
}

export function formatSigned(mm, lc, unit = 'mm') {
  const s = format(mm, lc, unit);
  return mm > 1e-9 ? `+${s}` : s;
}
