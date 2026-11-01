// Every string the figure shows, in Bangla (NCTB terms, as in the book) and English. Use t('key') in code, and
// t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: '{{title}}',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',
    unit_cm: 'সেমি',
    unit_mm: 'মিমি',
    act_drag: 'তীরটি টেনে সরাও',
    out_reading: 'পাঠ <b>{v} সেমি</b> = {cm} সেমি + {mm} × {lc} সেমি',
    rule_reading: '<b>পাঠ = সেন্টিমিটার দাগ + মিলিমিটার ঘর × ন্যূনাঙ্ক।</b> তীরটি অন্য জায়গায় টেনে নিয়ে আবার পড়ো।',
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_text: 'তীরটি কত সেন্টিমিটারে আছে?',
    q_hint: 'স্কেল পড়ে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক পাঠ',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় তীরটি আটকানো থাকে। স্কেল পড়ে উত্তর বেছে নাও।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: '{{title}}',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',
    unit_cm: 'cm',
    unit_mm: 'mm',
    act_drag: 'Drag the arrow',
    out_reading: 'Reading <b>{v} cm</b> = {cm} cm + {mm} × {lc} cm',
    rule_reading: '<b>Reading = centimetre mark + millimetre divisions × least count.</b> Drag the arrow somewhere else and read it again.',
    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_text: 'Where is the arrow, in centimetres?',
    q_hint: 'Read the scale, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The reading is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The arrow stays put during the test. Read the scale and pick an answer.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/** t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
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
