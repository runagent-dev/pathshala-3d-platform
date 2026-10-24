// The maths of the reading, kept apart from the 3D so it can be unit-tested. This template reads a ruler:
// reading = whole centimetres + millimetres × 0.1 cm (the least count, ন্যূনাঙ্ক, is 1 mm).

export const LC = 1; // mm
export const LENGTH = 150; // mm: a 15 cm ruler

export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** Whole centimetres (cm), extra millimetres (mm) and the reading in millimetres, for a position in mm. */
export function read(position) {
  const p = Math.min(LENGTH, Math.max(0, roundTo(position, LC)));
  const cm = Math.floor(p / 10 + 1e-9);
  return { cm, mm: Math.round(p - cm * 10), value: p };
}

/** "4.7": centimetres with one decimal, as the reading is written in the book. */
export const formatCm = (mm) => (mm / 10).toFixed(1);
