// Every string the figure shows, in Bangla and English. The book's words on pages 140–141 (topic 5.3.3): প্যাসকেলের
// সূত্র, "একটা আবদ্ধ পাত্রে তরল বা বায়বীয় পদার্থে বাইরে থেকে চাপ দেওয়া হলে সেই চাপ সমানভাবে সঞ্চালিত হয়ে পাত্রের সংলগ্ন
// গায়ে লম্বভাবে কাজ করবে", সিলিন্ডার, প্রস্থচ্ছেদ A₁ / A₂, বল প্রয়োগ, P = F₁/A₁, F₂ = PA₂ = F₁(A₂/A₁), "১০০ গুণ বল",
// কলকারখানা কিংবা বিমান নিয়ন্ত্রণে, বলবৃদ্ধিকরণ নীতি, শক্তি ("প্রথম সিলিন্ডারে যে পরিমাণ শক্তি প্রয়োগ করবে দ্বিতীয়
// সিলিন্ডারে ঠিক সেই পরিমাণ শক্তি ফিরে পাবে"), "তরলটি প্রবাহিত হবে যতক্ষণ পর্যন্ত না চাপ সমান হয়ে যায়". The scene's
// own words: হাতল, পিস্টন, তেল, গাড়ি, ওজন, লিফট. Use t('key', vars) in code and t.num() for numbers; numbers inside
// sentences come in as {vars}. A {key} that is not a var is another string of the same language: the symbols
// ({s_F1} = F<sub>1</sub> …: the bundled font has no ₁ ₂ ²) and the units ({u_N}, {u_Pa}, {u_m2}, {u_J}), always after
// a no-break space (&nbsp;).

const SYMBOLS = {
  s_F1: '<i>F</i><sub>1</sub>',
  s_F2: '<i>F</i><sub>2</sub>',
  s_A1: '<i>A</i><sub>1</sub>',
  s_A2: '<i>A</i><sub>2</sub>',
  s_d1: '<i>d</i><sub>1</sub>',
  s_d2: '<i>d</i><sub>2</sub>',
  s_P: '<i>P</i>',
  s_W: '<i>W</i>',
  u_N: 'N',
  u_Pa: 'Pa',
  u_m2: 'm<sup>2</sup>',
  u_J: 'J',
  u_m: 'm',
  u_cm: 'cm',
  u_mm: 'mm',
};

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    ...SYMBOLS,
    title: 'প্যাসকেলের সূত্র: হাইড্রোলিক গাড়ি তোলার লিফট',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the row of words: which lift piston
    ratios: 'বড় পিস্টনের প্রস্থচ্ছেদ বেছে নাও',
    chip: '{s_A2} = {k}{s_A1}',

    // the action and the quiet buttons
    act_push: 'হাতলে চাপ দাও',
    act_pump: '{n} বার চাপ দাও',
    act_lower: 'গাড়ি নামাও',
    act_inside: 'ভেতরে দেখো',
    act_all: 'পুরো লিফট',
    act_home: 'শুরুতে ফেরাও',

    // the formula: the stepper, the law, the sums
    name_F1: 'হাতলে বল',
    less_F: 'বল কমাও',
    more_F: 'বল বাড়াও',
    law_label: 'চাপ সব জায়গায় সমান: P = F₁/A₁ = F₂/A₂',
    sum_P: '{s_P} <span class="pl-def">= {s_F1}/{s_A1} </span>= {F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b class="c-P">{P}&nbsp;{u_Pa}</b>',
    sum_F2: '{s_F2} <span class="pl-def">= {s_F1}({s_A2}/{s_A1}) </span>= {F}&nbsp;{u_N} × {k} = <b class="c-F">{F2}&nbsp;{u_N}</b>',
    sum_W: 'গাড়ির ওজন {s_W} = <b class="c-W">{W}&nbsp;{u_N}</b>',
    cmp_more: '&gt;',
    cmp_less: '&lt;',

    // the result line
    out_ready: 'সামনের অংশ কেটে দেখানো; গাড়ি ছোট করে আঁকা',
    out_inside: '<b class="c-P">লাল তীর = তেলের চাপ:</b> সব সমান, দেয়ালে লম্ব',
    out_rim: 'হাতল {D} নামলে গাড়ি ওঠে মাত্র <b>{d}</b>',
    out_push: 'তেলের ভেতর দিয়ে চাপ ছড়িয়ে পড়ছে…',
    out_up: '{s_F2} &gt; {s_W}: হাতল নামল {D}, গাড়ি উঠল <b>{d}</b>',
    out_stuck: '{s_F2} &lt; {s_W} ({W}&nbsp;{u_N}): গাড়ি <b>উঠল না</b>',
    out_pump: '{n} বার চাপে হাতল নামল {D}, গাড়ি উঠল <b>{d}</b>',
    out_pumping: '{n} বার চাপ… (সময় দ্রুত করে দেখানো)',
    out_top: 'লিফট সবচেয়ে উঁচুতে: গাড়ি উঠেছে <b>{d}</b>',
    out_lower: 'তেল ট্যাংকে ফিরে যাচ্ছে, গাড়ি নামছে…',

    // the rule: the book's words, one idea at a time
    rule_law: '<b>প্যাসকেলের সূত্র:</b> একটা আবদ্ধ পাত্রে তরল বা বায়বীয় পদার্থে বাইরে থেকে চাপ দেওয়া হলে সেই চাপ সমানভাবে সঞ্চালিত হয়ে পাত্রের সংলগ্ন গায়ে লম্বভাবে কাজ করবে।',
    rule_equal:
      '<b>চাপ সব জায়গায় সমান:</b> {s_P} = {s_F1}/{s_A1} = {s_F2}/{s_A2}। তাই {s_F2} = {s_F1}({s_A2}/{s_A1}): বড় পিস্টনে বল {k} গুণ। সমান না হলে তেল প্রবাহিত হতো। ({s_F2}, {s_W}-এর তীর ছোট মাপে আঁকা)',
    rule_stuck: '<b>{s_F2} গাড়ির ওজনের চেয়ে কম।</b> হাতলে আরও জোরে চাপ দাও, নয়তো আরও বড় পিস্টন নাও: {s_A2}/{s_A1} যত বেশি, বল তত গুণ।',
    rule_energy:
      '<b>এটা বলবৃদ্ধিকরণ নীতি, শক্তি বাড়ে না।</b> একবার চাপে {s_F1}{s_d1} = {F}&nbsp;{u_N} × {d1}&nbsp;{u_m} = {E}&nbsp;{u_J}, আর {s_F2}{s_d2} = {F2}&nbsp;{u_N} × {d2}&nbsp;{u_m} = {E}&nbsp;{u_J}: যে শক্তি দিলে, ঠিক সেই শক্তি ফিরে পেলে।',
    rule_use: '<b>কলকারখানা কিংবা বিমান নিয়ন্ত্রণে এই পদ্ধতি ব্যবহার করা হয়।</b> বল {k} গুণ হয়, কিন্তু বড় পিস্টন সরে হাতলের {k} ভাগের এক ভাগ: তাই অনেকবার চাপ দিতে হয়।',

    // labels on the picture
    lbl_F1: '{s_F1} = {v}&nbsp;{u_N}',
    lbl_F2: '{s_F2} = {v}&nbsp;{u_N}',
    lbl_W: 'ওজন {s_W} = {v}&nbsp;{u_N}',
    lbl_A1: '{s_A1} = {v}&nbsp;{u_m2}',
    lbl_A2: '{s_A2} = {v}&nbsp;{u_m2}',
    lbl_P: '{s_P} = {v}&nbsp;{u_Pa}',
    lbl_P2: '{s_P} = {v}&nbsp;{u_Pa}',
    lbl_d1: '{s_d1} = {v}',
    lbl_d2: '{s_d2} = {v}',
    lbl_h: 'উঠেছে {v}',

    hint_wait: 'দেখো তেলের ভেতরে কী হয়।',
    hint_top: 'লিফট আর উঠবে না। গাড়ি নামাও।',
    hint_stuck: 'হাতল নড়ছে না: গাড়ির ওজন বেশি।',
    hint_press: 'আগে হাতলে চাপ দাও, তারপর তীর দেখা যাবে।',

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

    q_f2: 'হাতলে বল {s_F1} আর বড় পিস্টনের মাপ ছবিতে লেখা আছে। বড় পিস্টনে বল {s_F2} কত?',
    why_f2: '<b>{F2}&nbsp;{u_N}</b>: {s_F2} = {s_F1}({s_A2}/{s_A1}) = {F}&nbsp;{u_N} × {k}।',
    mis_f2_same: 'চাপ সমান থাকে, বল নয়: বড় পিস্টনের প্রস্থচ্ছেদ বেশি বলে বলও বেশি।',
    mis_f2_divide: 'উল্টো হয়েছে: বড় পিস্টনে বল বাড়ে, কমে না।',
    mis_f2_add: 'যোগ নয়, গুণ: {s_F2} = {s_F1} × ({s_A2}/{s_A1})।',

    q_rise: 'দুই পিস্টনের প্রস্থচ্ছেদ {s_A1} আর {s_A2} ছবিতে লেখা আছে। হাতল {d} নামালে গাড়ি কতটা উঠবে?',
    why_rise: '<b>{v}</b>: একই তেল {k} গুণ চওড়া সিলিন্ডারে ঢোকে, তাই ওঠে {k} ভাগের এক ভাগ: {d} ÷ {k}।',
    mis_rise_same: 'দুই পিস্টন সমান সরে না।',
    mis_rise_times: 'বল বাড়ে, দূরত্ব কমে।',
    mis_rise_tenth: '{k} দিয়ে ভাগ করতে হবে।',

    q_p: 'ছোট পিস্টনের নিচে তেলের চাপ ছবিতে লেখা আছে। বড় পিস্টনের নিচে চাপ কত?',
    why_p: '<b>{P}&nbsp;{u_Pa}</b>: প্যাসকেলের সূত্র: আবদ্ধ তরলে চাপ সমানভাবে সঞ্চালিত হয়, তাই দুই পিস্টনের নিচে চাপ সমান।',
    mis_p_times: 'বল {k} গুণ হয়, চাপ নয়: চাপ সব জায়গায় সমান।',
    mis_p_divide: 'চাপ কমে না; বড় প্রস্থচ্ছেদে একই চাপ বেশি বল দেয়।',
    mis_p_half: 'পাইপ দিয়ে যেতে চাপ হারায় না: চাপ সমানভাবে সঞ্চালিত হয়।',

    q_dir: 'হাতলে চাপ দিলে তেল সিলিন্ডারের দেয়ালে কোন দিকে চাপ দেয়?',
    c_perp: 'সব দেয়ালে লম্বভাবে',
    c_down: 'শুধু নিচের দিকে',
    c_along: 'দেয়ালের সমান্তরালে',
    c_big: 'শুধু বড় পিস্টনের দিকে',
    why_dir: '<b>সব দেয়ালে লম্বভাবে</b>: চাপ সমানভাবে সঞ্চালিত হয়ে পাত্রের সংলগ্ন গায়ে লম্বভাবে কাজ করে; লাল তীরগুলো দেখো।',
    mis_down: 'তরলের চাপ শুধু নিচে নয়, চারদিকে সঞ্চালিত হয়: পাশের দেয়ালেও।',
    mis_along: 'চাপ দেয়ালের গায়ে লম্বভাবে কাজ করে, গা বেয়ে নয়।',
    mis_big: 'চাপ সব দিকে সমান: ছোট পিস্টনের নিচে, পাইপে, দেয়ালে, সবখানে।',

    q_work: 'হাতলে বল {s_F1} দিয়ে হাতল {s_d1} নামানো হলো (ছবিতে লেখা)। বড় পিস্টন গাড়িকে কতটা শক্তি দেয়?',
    why_work:
      '<b>{E}&nbsp;{u_J}</b>: এটা বলবৃদ্ধিকরণ নীতি, শক্তি নয়: {s_F1}{s_d1} = {F}&nbsp;{u_N} × {dm}&nbsp;{u_m} = {E}&nbsp;{u_J}, আর ঠিক এই শক্তিই ফিরে আসে।',
    mis_work_times: 'বল {k} গুণ হয়, শক্তি নয়: গাড়ি ওঠে {k} ভাগের এক ভাগ।',
    mis_work_divide: 'শক্তি হারায় না: যে শক্তি দিলে, ঠিক সেই পরিমাণ ফিরে পাবে।',
    mis_work_cm: 'দূরত্ব cm থেকে m করা হয়নি।',
    mis_work_half: 'শক্তি অর্ধেক হয় না: দেওয়া শক্তি পুরোটাই ফিরে আসে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    ...SYMBOLS,
    title: 'Pascal’s law: a hydraulic car lift',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    ratios: 'Pick the big piston’s cross-section',
    chip: '{s_A2} = {k}{s_A1}',

    act_push: 'Push the handle',
    act_pump: 'Push {n} times',
    act_lower: 'Lower the car',
    act_inside: 'Look inside',
    act_all: 'Whole lift',
    act_home: 'Start again',

    name_F1: 'Push on the handle',
    less_F: 'Less force',
    more_F: 'More force',
    law_label: 'The pressure is the same everywhere: P = F₁/A₁ = F₂/A₂',
    sum_P: '{s_P} <span class="pl-def">= {s_F1}/{s_A1} </span>= {F}&nbsp;{u_N} ÷ {A}&nbsp;{u_m2} = <b class="c-P">{P}&nbsp;{u_Pa}</b>',
    sum_F2: '{s_F2} <span class="pl-def">= {s_F1}({s_A2}/{s_A1}) </span>= {F}&nbsp;{u_N} × {k} = <b class="c-F">{F2}&nbsp;{u_N}</b>',
    sum_W: 'The car’s weight {s_W} = <b class="c-W">{W}&nbsp;{u_N}</b>',
    cmp_more: '&gt;',
    cmp_less: '&lt;',

    out_ready: 'Front cut away; the car drawn smaller',
    out_inside: '<b class="c-P">Red arrows = oil pressure:</b> equal, square to walls',
    out_rim: 'The handle down {D}: the car up only <b>{d}</b>',
    out_push: 'The pressure spreads through the oil…',
    out_up: '{s_F2} &gt; {s_W}: handle down {D}, car up <b>{d}</b>',
    out_stuck: '{s_F2} &lt; {s_W} ({W}&nbsp;{u_N}): the car <b>stays down</b>',
    out_pump: '{n} pushes: handle down {D}, car up <b>{d}</b>',
    out_pumping: '{n} pushes… (shown sped up)',
    out_top: 'The lift is at its top: the car has risen <b>{d}</b>',
    out_lower: 'The oil goes back to the tank; the car comes down…',

    rule_law:
      '<b>Pascal’s law:</b> when pressure is applied from outside to a liquid or gas in a closed vessel, it is passed on equally and acts perpendicular to the walls of the vessel.',
    rule_equal:
      '<b>The pressure is the same everywhere:</b> {s_P} = {s_F1}/{s_A1} = {s_F2}/{s_A2}. So {s_F2} = {s_F1}({s_A2}/{s_A1}): {k} times the force. If not, the oil would flow. ({s_F2}, {s_W} arrows to a smaller scale)',
    rule_stuck:
      '<b>{s_F2} is less than the car’s weight.</b> Push the handle harder, or take a bigger piston: the bigger {s_A2}/{s_A1}, the more times the force.',
    rule_energy:
      '<b>It multiplies force, not energy.</b> One push: {s_F1}{s_d1} = {F}&nbsp;{u_N} × {d1}&nbsp;{u_m} = {E}&nbsp;{u_J}, and {s_F2}{s_d2} = {F2}&nbsp;{u_N} × {d2}&nbsp;{u_m} = {E}&nbsp;{u_J}: the energy you put in is exactly what you get back.',
    rule_use:
      '<b>Factories and aircraft controls use this.</b> The force is {k} times bigger, but the big piston moves one {k}th as far as the handle: so you push many times.',

    lbl_F1: '{s_F1} = {v}&nbsp;{u_N}',
    lbl_F2: '{s_F2} = {v}&nbsp;{u_N}',
    lbl_W: 'weight {s_W} = {v}&nbsp;{u_N}',
    lbl_A1: '{s_A1} = {v}&nbsp;{u_m2}',
    lbl_A2: '{s_A2} = {v}&nbsp;{u_m2}',
    lbl_P: '{s_P} = {v}&nbsp;{u_Pa}',
    lbl_P2: '{s_P} = {v}&nbsp;{u_Pa}',
    lbl_d1: '{s_d1} = {v}',
    lbl_d2: '{s_d2} = {v}',
    lbl_h: 'risen {v}',

    hint_wait: 'Watch what happens inside the oil.',
    hint_top: 'The lift goes no higher. Lower the car.',
    hint_stuck: 'The handle does not move: the car is too heavy.',
    hint_press: 'Push the handle first; then the arrows show.',

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

    q_f2: 'The push {s_F1} and both pistons are written on the picture. What is the force {s_F2} on the big piston?',
    why_f2: '<b>{F2}&nbsp;{u_N}</b>: {s_F2} = {s_F1}({s_A2}/{s_A1}) = {F}&nbsp;{u_N} × {k}.',
    mis_f2_same: 'The pressure stays the same, not the force.',
    mis_f2_divide: 'The wrong way round: the big piston gets more force, not less.',
    mis_f2_add: 'Multiply, don’t add: {s_F2} = {s_F1} × ({s_A2}/{s_A1}).',

    q_rise: '{s_A1} and {s_A2} are written on the picture. If the handle goes down {d}, how far does the car rise?',
    why_rise: '<b>{v}</b>: the same oil enters a cylinder {k} times wider, so it rises one {k}th as far: {d} ÷ {k}.',
    mis_rise_same: 'The two pistons do not move the same.',
    mis_rise_times: 'The force grows; the distance shrinks.',
    mis_rise_tenth: 'Divide by {k}.',

    q_p: 'The pressure under the small piston is on the picture. What is the pressure under the big piston?',
    why_p: '<b>{P}&nbsp;{u_Pa}</b>: Pascal’s law: the pressure is passed on equally, so it is the same under both pistons.',
    mis_p_times: 'The force grows {k} times, not the pressure.',
    mis_p_divide: 'The pressure does not drop.',
    mis_p_half: 'No pressure is lost in the pipe.',

    q_dir: 'When the handle is pushed, in which direction does the oil press on the cylinder’s walls?',
    c_perp: 'Square to every wall',
    c_down: 'Only downwards',
    c_along: 'Along the walls',
    c_big: 'Only towards the big piston',
    why_dir: '<b>Square to every wall</b>: passed on equally, it acts perpendicular to the walls (the red arrows).',
    mis_down: 'Not only down: the side walls get it too.',
    mis_along: 'It acts square to the walls, not along them.',
    mis_big: 'It is the same everywhere, in every direction.',

    q_work: '{s_F1} and the handle’s way down {s_d1} are on the picture. What energy does the car get?',
    why_work:
      '<b>{E}&nbsp;{u_J}</b>: force grows, energy does not: {s_F1}{s_d1} = {F}&nbsp;{u_N} × {dm}&nbsp;{u_m} = {E}&nbsp;{u_J} comes out again.',
    mis_work_times: 'The force grows {k} times, not the energy.',
    mis_work_divide: 'No energy is lost: you get back exactly what you put in.',
    mis_work_cm: 'The distance was not changed from cm to m.',
    mis_work_half: 'The energy does not halve: all that you put in comes back.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a symbol or a unit) is put in.
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
