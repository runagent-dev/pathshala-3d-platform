// The maths of the figure, kept apart from the 3D so it can be unit-tested (test/unit/liquid-expansion.test.js).
// Lengths are in centimetres, volumes in cm³.
//
// The flask (book Fig 6.06): a glass bulb with a narrow neck is filled with a liquid up to the mark A. On heating,
// the bulb expands first, so the level falls to B; the liquid expands more than the glass, so it then rises past A
// to C. AB × (cross-section of the neck) is the container's expansion V_B, BC × (cross-section) is the liquid's real
// expansion V_L, and the apparent expansion (what you would call the expansion if you forgot the container) is
// V_a = V_L − V_B, which is the rise A → C.

export const NECK_AREA = 2; // cm²: the cross-section of the neck's bore
export const FLASK = { AB: 1.5, BC: 3 }; // the drawn marks, cm (not to scale: real bulbs expand a hundred times less)
export const H1 = 0.3; // heat at which the bulb has finished expanding and the liquid has not started (level at B)

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
export const roundTo = (x, step) => +(Math.round(x / step) * step).toFixed(6);

/** The level relative to the mark A (cm, up is positive) when the flask has been heated by h (0 … 1). */
export function levelOffset(h, { AB, BC } = FLASK) {
  return -AB * smooth(h / H1) + BC * smooth((h - H1) / (1 - H1));
}

/** How much the glass has grown (1 = its first size): drawn bigger than life so the eye can see it. */
export const bulbScale = (h) => 1 + 0.05 * smooth(h / H1);

/** V_B, V_L and V_a in cm³ for the marks AB and BC (cm). */
export function volumes({ AB, BC } = FLASK, area = NECK_AREA) {
  const VB = roundTo(AB * area, 0.01);
  const VL = roundTo(BC * area, 0.01);
  return { VB, VL, Va: roundTo(VL - VB, 0.01), AC: roundTo(BC - AB, 0.01) };
}

/** The flask's step (0 start, 1 level at B, 2 level at C) → the heat it stands for. */
export const FLASK_HEAT = [0, H1, 1];

// The fever thermometer (book Fig 6.05): mercury in a glass tube with a narrow bend (constriction) at the foot.
export const THERMO = { T0: 35, TMAX: 42, hot: 39 }; // °C: where the column sits at rest, the top of the scale, the fever
/** Thermometer steps: 0 at rest, 1 in the warm water (column up), 2 taken out (column stays), 3 shaken (column down). */
export const THERMO_COLUMN = [THERMO.T0, THERMO.hot, THERMO.hot, THERMO.T0];

/** "38.6": one decimal, as a thermometer is read. */
export const oneDecimal = (x) => (Math.round(x * 10) / 10).toFixed(1);
