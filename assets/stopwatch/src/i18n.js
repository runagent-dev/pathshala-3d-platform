// Every string the stopwatch shows, in Bangla (as the book, page 23: থামা ঘড়ি, স্টপ ওয়াচ, সময়কাল) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'থামা ঘড়ি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'সময়',
    unit_s: 'সেকেন্ড',
    unit_min: 'মিনিট',

    min_long: 'মিনিট',
    sec_long: 'সেকেন্ড',
    total_long: 'মোট সেকেন্ড',
    idea: 'যে মুহূর্তে চালু করা হয় সেখান থেকে থামা ঘড়ি সময় মাপে, থামালে মাপা বন্ধ হয়। ন্যূনাঙ্ক ০.০১ সেকেন্ড: ছোট দুই অঙ্ক সেকেন্ডের শতভাগ।',
    read_line: 'পর্দায় {main} {small} মানে {min} মিনিট {sec} সেকেন্ড = {total} সেকেন্ড।',

    act_start: 'চালু করো',
    act_stop: 'থামাও',
    act_reset: 'শূন্য করো',
    act_lamp: 'বাতির সময় মাপো',
    act_lamp_again: 'আবার বাতি জ্বালাও',
    label_start: 'চালু/থামা',
    label_reset: 'শূন্য',
    brand: 'পাঠশালা',

    status_zero: 'শূন্যে আছে',
    status_running: 'চলছে…',
    status_stopped: 'থেমেছে: পাঠ পড়ো',
    status_wait: 'বাতির দিকে তাকিয়ে থাকো…',
    status_lamp_on: 'বাতি জ্বলছে!',
    status_locked: 'পরীক্ষার জন্য আটকানো',
    hint_reset_running: 'চলার সময় শূন্য হয় না: আগে থামাও, তারপর শূন্য করো।',
    hint_lamp: 'বাতি জ্বললেই ঘড়ি চালু করো, নিভলেই থামাও।',
    hint_stop_now: 'বাতি নিভে গেছে: থামাও!',
    lamp_result: 'বাতি জ্বলেছিল {real} সেকেন্ড, তুমি মেপেছ {measured} সেকেন্ড: পার্থক্য {diff} সেকেন্ড।',
    lamp_why: 'চোখে দেখে আঙুলে চাপ দিতে একটু সময় লাগে, তাই হাতে মাপা সময়ের ভুল ন্যূনাঙ্কের (০.০১ সেকেন্ড) চেয়ে অনেক বেশি।',
    lamp_missed: 'বাতি জ্বলার সময় ঘড়ি চালু হয়নি। আবার চেষ্টা করো।',
    lamp_label: 'বাতি',

    coach_tap: 'চাপ দিলে ঘড়ি চলবে',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_read: 'থামা ঘড়ি কত সময় দেখাচ্ছে?',
    q_interval: 'বল প্রথম দাগ পার হওয়ার সময় ঘড়িতে ছিল {a}। দ্বিতীয় দাগে ঘড়ির পাঠ পর্দায়। দুই দাগের মাঝে কত সময় লাগল?',
    q_show: '{s} সেকেন্ড থামা ঘড়ির পর্দায় কীভাবে দেখাবে?',
    q_lc: 'এই থামা ঘড়ির ন্যূনাঙ্ক (সবচেয়ে ছোট যে সময় মাপা যায়) কত?',
    lc_why: 'ছোট দুই অঙ্ক সেকেন্ডের শতভাগ গোনে: এক ঘর = <b>{lc} সেকেন্ড</b>।',
    show_why: '{s} সেকেন্ড = {min} মিনিট ({min} × ৬০ = {m60}) + {sec} সেকেন্ড: পর্দায় <b>{disp}</b>',
    q_hint: 'পাঠ পড়ে, হিসাব করে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ঘড়ি আটকানো থাকে। পাঠ পড়ে উত্তর বেছে নাও।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Stopwatch',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Time',
    unit_s: 's',
    unit_min: 'min',

    min_long: 'minutes',
    sec_long: 'seconds',
    total_long: 'total seconds',
    idea: 'A stopwatch measures time from the moment it is started until it is stopped. Least count 0.01 s: the two small digits are hundredths of a second.',
    read_line: 'The display {main} {small} means {min} min {sec} s = {total} s.',

    act_start: 'Start',
    act_stop: 'Stop',
    act_reset: 'Reset',
    act_lamp: 'Time the lamp',
    act_lamp_again: 'Light the lamp again',
    label_start: 'START/STOP',
    label_reset: 'RESET',
    brand: 'Pathshala',

    status_zero: 'At zero',
    status_running: 'Running…',
    status_stopped: 'Stopped: read it',
    status_wait: 'Watch the lamp…',
    status_lamp_on: 'The lamp is on!',
    status_locked: 'Locked for the test',
    hint_reset_running: 'It does not reset while running: stop it first, then reset.',
    hint_lamp: 'Start the watch when the lamp lights, stop it when it goes out.',
    hint_stop_now: 'The lamp is out: stop!',
    lamp_result: 'The lamp was on for {real} s, you measured {measured} s: a difference of {diff} s.',
    lamp_why: 'It takes a moment to see and press, so a time measured by hand is off by much more than the least count (0.01 s).',
    lamp_missed: 'The watch was not started while the lamp was on. Try again.',
    lamp_label: 'Lamp',

    coach_tap: 'Press to start the watch',
    coach_lens: 'Drag here to move the magnifier',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_read: 'What time does the stopwatch show?',
    q_interval:
      'When the ball passed the first line the watch showed {a}. At the second line the reading is on the display. How long did it take between the lines?',
    q_show: 'How will {s} seconds look on the stopwatch?',
    q_lc: 'What is the least count of this stopwatch (the smallest time it can measure)?',
    lc_why: 'The two small digits count hundredths of a second: one step = <b>{lc} s</b>.',
    show_why: '{s} s = {min} min ({min} × 60 = {m60}) + {sec} s: the display shows <b>{disp}</b>',
    q_hint: 'Read the display, work it out and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The watch is locked during the test. Read it and pick an answer.',
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
