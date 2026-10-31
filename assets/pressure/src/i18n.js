// Every string the figure shows, in Bangla and English. The book's words on page 129 (topic 5.1): চাপ (Pressure), বল,
// ক্ষেত্রফল, বল প্রয়োগ, "বল প্রয়োগকারী ক্ষেত্রফল", P = F/A, F = PA, "চাপের একক N/m² অথবা Pa (প্যাসকেল)", "চাপের
// মাত্রা [P] = ML⁻¹T⁻²", দ্বিগুণ, অর্ধেক, স্কেলার রাশি, "প্রত্যেকবার তুমি সমান পরিমাণ বল প্রয়োগ করলেও চাপ কিন্তু হবে
// ভিন্ন", "কতটুকু জায়গায় বল প্রয়োগ করা হচ্ছে তার উপরে চাপ নির্ভর করে" (চিত্র ৫.০১), "চাপ স্কেলার হওয়ার কারণে এর কোনো
// দিক নেই". The page writes উপর. The scene's own words: হিল জুতা, কেডস, নরম মাটি, ছাপ.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N}, {u_Pa}, {u_cm2}, {u_m2} (written with <sup>: the
// bundled font has no ²), always after a no-break space (  below).

export const STRINGS = {
  bn: {
    title: 'চাপ: একই বল, ভিন্ন ক্ষেত্রফল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'চাপ',
    u_N: 'N',
    u_Pa: 'Pa',
    u_cm2: 'cm<sup>2</sup>',
    u_m2: 'm<sup>2</sup>',

    // the row of words: where to look
    views: 'কোথায় দেখবে',
    chip_both: 'দুটো জুতা',
    chip_heel: 'হিলের নিচে',
    chip_sneaker: 'কেডসের নিচে',

    // the action and the quiet button
    act_stand: 'নরম মাটিতে দাঁড়াও',
    act_lift: 'পা তুলে ছাপ দেখো',
    act_again: 'আবার দাঁড়াও',
    act_home: 'শুরুতে ফেরাও',

    // the formula: the stepper, the law, the sums
    name_F: 'প্রতিটি জুতার উপর বল',
    less_F: 'বল কমাও',
    more_F: 'বল বাড়াও',
    law_label: 'চাপ = বল ÷ ক্ষেত্রফল: P = F/A',
    shoe_heel: 'হিল',
    shoe_sneaker: 'কেডস',
    sum: '{F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b>{P}&nbsp;{u_Pa}</b>',

    // the result line
    out_ready: 'দুই জুতার উপর সমান বল: <b>{F}&nbsp;{u_N}</b>',
    out_press: 'মাটি দেবে যাচ্ছে…',
    out_both: 'একই বলে হিলের নিচে চাপ কেডসের <b>{k} গুণ</b>',
    out_heel: 'মাত্র {A}&nbsp;{u_cm2} জায়গায় পুরো বল: চাপ <b>{P}&nbsp;{u_Pa}</b>',
    out_sneaker: '{A}&nbsp;{u_cm2} জায়গায় একই বল ছড়িয়ে: চাপ <b>{P}&nbsp;{u_Pa}</b>',
    out_lift: 'হিলের ছাপ গভীর, কেডসের ছাপ অগভীর: চাপ <b>{k} গুণ</b>',

    // the rule: the book's words, one idea at a time
    rule_start: '<b>সমান পরিমাণ বল প্রয়োগ করলেও চাপ কিন্তু হবে ভিন্ন:</b> কতটুকু জায়গায় বল প্রয়োগ করা হচ্ছে তার উপরে চাপ নির্ভর করে।',
    rule_stand:
      '<b>চাপ P = F/A।</b> দুই জুতার উপর একই বল F, কিন্তু হিলের ক্ষেত্রফল A কম ({Ah}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2}), তাই চাপ বেশি: মাটি বেশি দেবে যায়।',
    rule_lift: '<b>বল প্রয়োগকারী ক্ষেত্রফল বেশি হলে চাপ কম:</b> কেডসের ক্ষেত্রফল হিলের {k} গুণ, তাই চাপ {k} ভাগের এক ভাগ। ছাপও অগভীর।',
    rule_force: '<b>বল বাড়লে চাপও বাড়ে:</b> বল দ্বিগুণ হলে চাপ দ্বিগুণ। আর বই বলে, ক্ষেত্রফল দ্বিগুণ হলে চাপ অর্ধেক।',
    rule_law: '<b>চাপের একক N/m<sup>2</sup> অথবা Pa (প্যাসকেল)।</b> চাপ স্কেলার রাশি, এর কোনো দিক নেই; লাল তীর দেখায় মাটির কোথায় কত চাপ পড়ছে।',

    // notes on the stage
    note_cut: 'সামনের মাটি কেটে সরানো',
    note_arrows: 'লাল তীর যত লম্বা, চাপ তত বেশি',

    // labels on the picture
    lbl_F: 'F = {v}&nbsp;{u_N}',
    lbl_P: 'P = {v}&nbsp;{u_Pa}',
    lbl_A: 'A = {v}&nbsp;{u_cm2}',
    lbl_deep: 'গভীর ছাপ',
    lbl_shallow: 'অগভীর ছাপ',

    hint_wait: 'দেখো মাটির কী হয়।',
    hint_arrows: 'আগে মাটিতে দাঁড়াও, তারপর তীর দেখা যাবে।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_heel: 'হিল জুতার উপর বল আর তার ক্ষেত্রফল ছবিতে লেখা আছে। হিলের নিচে মাটির উপর চাপ কত?',
    why_heel: '<b>{P}&nbsp;{u_Pa}</b>: P = F/A = {F}&nbsp;{u_N} ÷ {Am}&nbsp;{u_m2} ({Ac}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2})।',
    mis_heel_other: 'এটি কেডসের ক্ষেত্রফল দিয়ে ভাগ করলে হয়।',
    mis_heel_cm2: 'cm<sup>2</sup>-কে m<sup>2</sup> না করে ভাগ করা হয়েছে; {one}&nbsp;m<sup>2</sup> = {many}&nbsp;cm<sup>2</sup>।',
    mis_heel_times: 'এটি বল × ক্ষেত্রফল; চাপ হলো বল ÷ ক্ষেত্রফল।',

    q_force: 'কেডসের নিচে চাপ আর তার ক্ষেত্রফল ছবিতে লেখা আছে। কেডসের উপর বল F কত?',
    why_force: '<b>{F}&nbsp;{u_N}</b>: বই লেখে F = PA = {P}&nbsp;{u_Pa} × {Am}&nbsp;{u_m2} ({Ac}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2})।',
    mis_force_divide: 'এটি চাপ ÷ ক্ষেত্রফল; বল পেতে গুণ করতে হয়: F = PA।',
    mis_force_cm2: 'cm<sup>2</sup>-কে m<sup>2</sup> না করে গুণ করা হয়েছে।',
    mis_force_other: 'এটি হিলের ক্ষেত্রফল দিয়ে গুণ করলে হয়।',

    q_double: 'বইয়ের পাথরটিকে এক হাতের বদলে দুই হাতে সমান বলে ঠেললে বল প্রয়োগকারী ক্ষেত্রফল দ্বিগুণ হয়। চাপ কী হবে?',
    c_half: 'অর্ধেক হবে',
    c_double: 'দ্বিগুণ হবে',
    c_same: 'একই থাকবে',
    c_four: 'চার গুণ হবে',
    why_double: '<b>অর্ধেক হবে</b>: P = F/A; F একই, A দ্বিগুণ, তাই চাপ অর্ধেক।',
    mis_double: 'ক্ষেত্রফল বাড়লে চাপ বাড়ে না, কমে: A নিচে ভাগ করে।',
    mis_same: 'বল একই, কিন্তু চাপ নির্ভর করে কতটুকু জায়গায় বল পড়ছে তার উপর।',
    mis_four: 'বল বা ক্ষেত্রফল চার গুণ হয়নি; ক্ষেত্রফল শুধু দ্বিগুণ।',

    q_prints: 'দুজনে সমান বলে নরম মাটিতে দাঁড়িয়ে পা তুলেছে। হিলের ছাপ বেশি গভীর কেন?',
    c_less_area: 'একই বল কম জায়গায় পড়েছে',
    c_more_force: 'হিল জুতার উপর বল বেশি ছিল',
    c_sneaker_small: 'কেডসের ক্ষেত্রফল হিলের চেয়ে কম',
    c_soft_ground: 'হিলের নিচের মাটি বেশি নরম',
    why_prints: '<b>একই বল কম জায়গায় পড়েছে</b>: হিলের ক্ষেত্রফল কম, তাই P = F/A বেশি; বেশি চাপে মাটি বেশি দেবে যায়।',
    mis_more_force: 'দুই জুতার উপর বল সমান ছিল; তফাত ক্ষেত্রফলে।',
    mis_sneaker_small: 'উল্টো: কেডসের ক্ষেত্রফল হিলের চার গুণ।',
    mis_soft_ground: 'একই মাটি; তফাত হলো কতটুকু জায়গায় বল পড়েছে।',

    q_unit: 'মাটির উপর এই চাপ কোন এককে মাপা হয়?',
    c_pa: 'N/m<sup>2</sup> বা Pa',
    c_newton: 'N (নিউটন)',
    c_nm: 'N m',
    c_m2: 'm<sup>2</sup>',
    why_unit: '<b>N/m<sup>2</sup> বা Pa (প্যাসকেল)</b>: চাপ = বল ÷ ক্ষেত্রফল, তাই একক N ÷ m<sup>2</sup>।',
    mis_newton: 'N বলের একক; চাপে বলকে ক্ষেত্রফল দিয়ে ভাগ করতে হয়।',
    mis_nm: 'N m (জুল) কাজের একক।',
    mis_m2: 'm<sup>2</sup> ক্ষেত্রফলের একক।',
  },
  en: {
    title: 'Pressure: the same force on different areas',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Pressure',
    u_N: 'N',
    u_Pa: 'Pa',
    u_cm2: 'cm<sup>2</sup>',
    u_m2: 'm<sup>2</sup>',

    views: 'Where to look',
    chip_both: 'Both shoes',
    chip_heel: 'Under the heel',
    chip_sneaker: 'Under the sneaker',

    act_stand: 'Stand on the soft clay',
    act_lift: 'Lift the feet, see the prints',
    act_again: 'Stand again',
    act_home: 'Back to the start',

    name_F: 'Force on each shoe',
    less_F: 'Less force',
    more_F: 'More force',
    law_label: 'Pressure = force ÷ area: P = F/A',
    shoe_heel: 'Heel',
    shoe_sneaker: 'Sneaker',
    sum: '{F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b>{P}&nbsp;{u_Pa}</b>',

    out_ready: 'The same force on both shoes: <b>{F}&nbsp;{u_N}</b>',
    out_press: 'The clay is giving way…',
    out_both: 'Same force: the heel’s pressure is <b>{k} times</b>',
    out_heel: 'All the force on {A}&nbsp;{u_cm2}: P = <b>{P}&nbsp;{u_Pa}</b>',
    out_sneaker: 'Spread over {A}&nbsp;{u_cm2}: P = <b>{P}&nbsp;{u_Pa}</b>',
    out_lift: 'Deep print, shallow print: <b>{k} times</b> the pressure',

    rule_start: '<b>The same force, yet a different pressure:</b> pressure depends on how much area the force acts on.',
    rule_stand:
      '<b>Pressure P = F/A.</b> The same force F on both shoes, but the heel’s area A is smaller ({Ah}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2}), so the pressure is bigger: the clay gives way more.',
    rule_lift:
      '<b>A bigger area means less pressure:</b> the sneaker’s area is {k} times the heel’s, so its pressure is one {k}th. Its print is shallow too.',
    rule_force:
      '<b>More force, more pressure:</b> twice the force gives twice the pressure. And the book says: twice the area gives half the pressure.',
    rule_law:
      '<b>Pressure is measured in N/m<sup>2</sup> or Pa (pascal).</b> Pressure is a scalar: it has no direction; the red arrows show where on the clay how much pressure acts.',

    note_cut: 'The clay in front is cut away',
    note_arrows: 'Longer red arrow: more pressure',

    lbl_F: 'F = {v}&nbsp;{u_N}',
    lbl_P: 'P = {v}&nbsp;{u_Pa}',
    lbl_A: 'A = {v}&nbsp;{u_cm2}',
    lbl_deep: 'deep print',
    lbl_shallow: 'shallow print',

    hint_wait: 'Watch what the clay does.',
    hint_arrows: 'Stand on the clay first; then the arrows show.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Great! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture is locked during the test. Pick an answer from the picture.',

    q_heel: 'The force on the high heel and its area are written on the picture. What is the pressure on the clay under the heel?',
    why_heel: '<b>{P}&nbsp;{u_Pa}</b>: P = F/A = {F}&nbsp;{u_N} ÷ {Am}&nbsp;{u_m2} ({Ac}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2}).',
    mis_heel_other: 'That divides by the sneaker’s area.',
    mis_heel_cm2: 'That divides by cm<sup>2</sup> without changing to m<sup>2</sup>; {one}&nbsp;m<sup>2</sup> = {many}&nbsp;cm<sup>2</sup>.',
    mis_heel_times: 'That is force × area; pressure is force ÷ area.',

    q_force: 'The pressure under the sneaker and its area are written on the picture. What is the force F on the sneaker?',
    why_force: '<b>{F}&nbsp;{u_N}</b>: the book writes F = PA = {P}&nbsp;{u_Pa} × {Am}&nbsp;{u_m2} ({Ac}&nbsp;{u_cm2} = {Am}&nbsp;{u_m2}).',
    mis_force_divide: 'That is pressure ÷ area; for the force, multiply: F = PA.',
    mis_force_cm2: 'That multiplies by cm<sup>2</sup> without changing to m<sup>2</sup>.',
    mis_force_other: 'That multiplies by the heel’s area.',

    q_double:
      'Pushing the book’s stone with two hands instead of one, with the same force, doubles the area the force acts on. What happens to the pressure?',
    c_half: 'It halves',
    c_double: 'It doubles',
    c_same: 'It stays the same',
    c_four: 'It becomes four times',
    why_double: '<b>It halves</b>: P = F/A; F is the same and A doubles, so the pressure halves.',
    mis_double: 'A bigger area does not raise the pressure, it lowers it: A divides.',
    mis_same: 'The force is the same, but pressure depends on how much area it acts on.',
    mis_four: 'Neither the force nor the area became four times; the area only doubled.',

    q_prints: 'Two people stood on soft clay with the same force and lifted their feet. Why is the heel’s print deeper?',
    c_less_area: 'The same force acted on less area',
    c_more_force: 'There was more force on the heel',
    c_sneaker_small: 'The sneaker’s area is smaller',
    c_soft_ground: 'The clay under the heel is softer',
    why_prints: '<b>The same force acted on less area</b>: the heel’s area is small, so P = F/A is big; more pressure pushes the clay in deeper.',
    mis_more_force: 'The force on the two shoes was the same; the difference is the area.',
    mis_sneaker_small: 'The other way round: the sneaker’s area is four times the heel’s.',
    mis_soft_ground: 'It is the same clay; the difference is how much area the force acted on.',

    q_unit: 'In what unit is this pressure on the clay measured?',
    c_pa: 'N/m<sup>2</sup> or Pa',
    c_newton: 'N (newton)',
    c_nm: 'N m',
    c_m2: 'm<sup>2</sup>',
    why_unit: '<b>N/m<sup>2</sup> or Pa (pascal)</b>: pressure = force ÷ area, so its unit is N ÷ m<sup>2</sup>.',
    mis_newton: 'N is the unit of force; pressure divides the force by an area.',
    mis_nm: 'N m (joule) is the unit of work.',
    mis_m2: 'm<sup>2</sup> is the unit of area.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
