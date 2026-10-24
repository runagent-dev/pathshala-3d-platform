// Screw-gauge reading, as in the book (page 21): one turn moves the screw by the pitch (1 mm) and the
// circular scale has 100 parts, so the least count (ন্যূনাঙ্ক) is 1 mm ÷ 100 = 0.01 mm.
//   reading = L + C × LC     L: linear-scale reading (mm), C: circular-scale division at the datum line

export const PITCH = 1; // mm per turn
export const DIVISIONS = 100; // parts on the circular scale
export const LC = PITCH / DIVISIONS; // 0.01 mm
export const RANGE = 25; // mm

export const roundTo = (x, step) => Math.round(x / step) * step;

/** L, C and the reading for a gap (mm) between the anvil and the spindle. */
export function read(gap) {
  const g = Math.max(0, roundTo(gap, LC));
  let L = Math.floor(g / PITCH + 1e-9) * PITCH;
  let C = Math.round((g - L) / LC);
  if (C >= DIVISIONS) {
    L += PITCH;
    C = 0;
  }
  return { L, C, value: +(L + C * LC).toFixed(2) };
}

/** "3.47" — always two decimals, like the instrument reads. */
export const format = (mm) => (+mm).toFixed(2);
