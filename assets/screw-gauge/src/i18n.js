// All text for the screw gauge. Terms follow the book (page 21): পিচ, বৃত্তাকার স্কেল, ন্যূনাঙ্ক.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'স্ক্রু-গেইজ',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    unit_mm: 'মিমি',

    lin_long: 'রৈখিক স্কেল পাঠ',
    cir_long: 'বৃত্তাকার স্কেল পাঠ',
    lc_long: 'ন্যূনাঙ্ক',
    lc_line: 'ন্যূনাঙ্ক = পিচ ÷ বৃত্তাকার স্কেলের ভাগ = {pitch} মিমি ÷ {n} = {lc} মিমি',

    status_free: 'স্ক্রু ঘুরিয়ে মাপো',
    status_closed: 'দুই প্রান্ত লেগে আছে, পাঠ শূন্য',
    status_contact: '{object} স্পর্শ করেছে',
    status_locked: 'পরীক্ষার জন্য আটকানো',
    hint_contact: 'ছুঁয়েছে। র‍্যাচেট ক্লিক করে, স্ক্রু আর এগোয় না। এবার স্কেল দুটি পড়ো।',

    obj_add: 'একটি বস্তু মাপো',
    obj_remove: 'বস্তু সরাও',
    obj_wire: 'তামার তার',
    obj_ball: 'ইস্পাতের বল',
    obj_plate: 'কাচের পাত',
    obj_wire_q: 'তামার তারের ব্যাস',
    obj_ball_q: 'ইস্পাতের বলের ব্যাস',
    obj_plate_q: 'কাচের পাতের পুরুত্ব',

    coach_turn: 'এখানে ধরে ঘোরাও বা টানো',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_text: '{what} কত?',
    q_hint: 'দুটি স্কেল পড়ে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক পাঠ',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় স্ক্রু আটকানো থাকে। স্কেল পড়ে উত্তর বেছে নাও।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Screw gauge',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    unit_mm: 'mm',
    lin_long: 'linear scale',
    cir_long: 'circular scale',
    lc_long: 'least count',
    lc_line: 'least count = pitch ÷ parts of the circular scale = {pitch} mm ÷ {n} = {lc} mm',
    status_free: 'Turn the screw to measure',
    status_closed: 'Ends touching: the reading is zero',
    status_contact: 'Touching the {object}',
    status_locked: 'Locked for the test',
    hint_contact: 'Touching. The ratchet clicks and the screw stops. Now read both scales.',
    obj_add: 'Measure an object',
    obj_remove: 'Remove object',
    obj_wire: 'copper wire',
    obj_ball: 'steel ball',
    obj_plate: 'glass plate',
    obj_wire_q: 'diameter of the copper wire',
    obj_ball_q: 'diameter of the steel ball',
    obj_plate_q: 'thickness of the glass plate',
    coach_turn: 'Hold here: turn or pull',
    coach_lens: 'Drag here to move the magnifier',
    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_text: 'What is the {what}?',
    q_hint: 'Read both scales, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The reading is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The screw stays locked during the test. Read the scales and pick an answer.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

export function createI18n(lang = 'bn', { numerals } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? num(vars[k]) : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
