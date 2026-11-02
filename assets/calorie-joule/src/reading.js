// The maths of the heat-units figure (book page 161, topic 6.1): the book's "1 gm পানির তাপমাত্রা 1°C বাড়াতে হলে যে পরিমাণ
// তাপের দরকার সেটা হচ্ছে 1 ক্যালরি। 1 ক্যালরি হচ্ছে 4.2 J এর সমান", and the food calorie (k cal = 1000 cal). Kept apart from the
// 3D so it can be unit-tested. One gram of water takes 1 cal for each °C it rises, so n cal raise it n °C, and n cal is
// n × 4.2 J. The drawing steps through 0 … 5 cal; the test also uses n cal for bigger n only in words, never on screen.

export const CAL_J = 4.2; // 1 cal = 4.2 J
export const FOOD_CAL = 1000; // 1 k cal (the food calorie) = 1000 cal
export const MAX_STEPS = 5; // the heat button: up to 5 cal, then it starts again
export const WATER_G = 1; // one gram of water

/** Rounds to one decimal and drops a trailing ".0": 12.600000000000001 → 12.6, 8.4 → 8.4, 4 → 4. */
export const fmt = (x) => String(+(+x).toFixed(1));

/** Two decimals, no trailing zeros: 0.714 → 0.71 (for the n ÷ 4.2 mistake, which must not look like 1). */
export const fmt2 = (x) => String(+(+x).toFixed(2));

/** The heat in joules for n calories (4.2 J each). */
export const joules = (cal) => +(cal * CAL_J).toFixed(6);
/** The heat in calories for n joules. */
export const calories = (j) => +(j / CAL_J).toFixed(6);
/** How many °C one gram of water rises for n cal (1 cal per °C per gram). */
export const rise = (cal, grams = WATER_G) => cal / grams;

/** The heat button: one more calorie, and after the last it starts again from nothing. */
export const nextCount = (n) => (n >= MAX_STEPS ? 0 : n + 1);

// ── the test ──────────────────────────────────────────────────────────────────
// Every question returns the right answer first (as { key, v }) and three wrong ones from real mistakes.

/** "1 cal = ? J": the right 4.2; the factor upside down (about 0.24); a slip of ten; and "1 cal is 1 J". */
export function calToJChoices() {
  return [
    { key: 'right', v: CAL_J },
    { key: 'flip', v: +(1 / CAL_J).toFixed(2) },
    { key: 'ten', v: 42 },
    { key: 'same', v: 1 },
  ];
}

/** "How much heat raises 1 gm of water by 1 °C?": 1 cal; 4.2 cal (the joule number); 1 J; 1000 cal (the food calorie). */
export function waterChoices() {
  return [
    { key: 'right', v: 1, unit: 'cal' },
    { key: 'joule', v: CAL_J, unit: 'cal' },
    { key: 'oneJ', v: 1, unit: 'J' },
    { key: 'food', v: FOOD_CAL, unit: 'cal' },
  ];
}

/** "The water rose n °C: how many cal?": n; 4.2 n (the joules); n ÷ 4.2; and 1 (forgetting that it grows with n). */
export function calChoices(n) {
  return [
    { key: 'right', v: n },
    { key: 'times', v: fmt(joules(n)) },
    { key: 'divide', v: fmt2(calories(n)) },
    { key: 'one', v: 1 },
  ];
}

/** "The water rose n °C: how many J?": 4.2 n; n (the calories); n ÷ 4.2; and 4.2 (for one calorie only). */
export function jouleChoices(n) {
  return [
    { key: 'right', v: fmt(joules(n)) },
    { key: 'cal', v: n },
    { key: 'divide', v: fmt2(calories(n)) },
    { key: 'one', v: CAL_J },
  ];
}

/** "1 k cal (food calorie) = ? cal": 1000; 1; 4.2; 100. */
export function foodChoices() {
  return [
    { key: 'right', v: FOOD_CAL },
    { key: 'same', v: 1 },
    { key: 'joule', v: CAL_J },
    { key: 'hundred', v: 100 },
  ];
}

/** The n the two picture questions use (the thermometer shows it), in the order given: no two the same. */
export const QUIZ_RISES = [2, 3, 4, 5];
