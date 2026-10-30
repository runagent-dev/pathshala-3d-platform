// Every string the figure shows, in Bangla (in the book's words, pages 106–107, ৪.৩.২: বিভব শক্তি, স্প্রিং, স্প্রিংয়ের
// ধ্রুবক k, স্থির অবস্থা, x দূরত্ব সংকুচিত, বল F, শক্তি সঞ্চিত হয়, V = ½kx²) and English. Units are Latin symbols (N,
// N/m, cm, m, J) as in docs/book-notes.md. Use t('key', vars) in code and t.num() for numbers (Bangla digits in Bangla).
// {half} is the book's stacked ½ and {two} the square's 2; no-break spaces ( ) keep a number with its unit.

export const STRINGS = {
  bn: {
    title: 'স্প্রিংয়ের বিভব শক্তি',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বিভব শক্তি',

    u_N: 'N',
    u_Nm: 'N/m',
    u_cm: 'cm',
    u_m: 'm',
    u_J: 'J',

    // the examples (one row of words): the book's picture (a) at rest, (b) pulled out, (c) pushed in
    examples: 'স্প্রিংয়ের অবস্থা',
    ex_rest: 'স্থির অবস্থা',
    ex_stretched: 'টেনে লম্বা',
    ex_compressed: 'চেপে সংকুচিত',
    res_J: '{V} J',

    // the calculator: tap steppers for x and k
    calc: 'x আর k বদলাও',
    calc_x: 'দূরত্ব x',
    calc_k: 'ধ্রুবক k',
    x_down: 'স্প্রিং ছোট করো (দেয়ালের দিকে)',
    x_up: 'স্প্রিং লম্বা করো (বাইরের দিকে)',
    k_down: 'নরম স্প্রিং (k কমাও)',
    k_up: 'শক্ত স্প্রিং (k বাড়াও)',

    // the action (the big button and the numbered ring on the handle)
    act_pull5: '{x} cm টেনে ধরো',
    act_double: 'দ্বিগুণ দূরত্বে টানো',
    act_push: 'এবার চেপে সংকুচিত করো',
    act_release: 'আস্তে ছেড়ে দাও',
    act_again: 'আবার টেনে ধরো',
    act_home: 'স্থির অবস্থায় ফেরাও',
    drag_hint: 'হাতলটি আঙুলে টেনে বা ঠেলে দেখো',

    // the result: the two formulas, each letter a button that lights its part of the picture
    fx: 'সূত্র: যেকোনো অক্ষর ছুঁয়ে দেখো ছবিতে সেটি কোথায়',
    w_F: 'বল',
    w_V: 'বিভব শক্তি',
    half: '{half}',
    sym_F: 'F: বল (তীর)',
    sym_k: 'k: স্প্রিংয়ের ধ্রুবক (স্প্রিং)',
    sym_x: 'x: দূরত্ব (কমলা দাগ)',
    sym_half: 'এক-অর্ধেক কেন',
    sym_sq: 'x-এর বর্গ',
    sym_V: 'V: বিভব শক্তি',
    // what a tapped letter means, with the student's numbers
    why_F:
      '<b>F = kx = {k} × {xm} = {F} N</b>: হাত যে বলে টানছে বা চাপছে (সবুজ তীর F<sub>P</sub>)। স্প্রিংও সমান বলে উল্টো দিকে টানে (নীল তীর F<sub>S</sub>)। x যত বড়, বল তত বড়।',
    why_k: '<b>k = {k} N/m</b>: স্প্রিংয়ের ধ্রুবক, স্প্রিংটি কত শক্ত। শক্ত স্প্রিংয়ে k বড়: একই x-এ বেশি বল লাগে, শক্তিও বেশি জমে। k-এর + − বোতামে বদলে দেখো।',
    why_x: '<b>x = {x} cm = {xm} m</b>: স্থির অবস্থা (x = {z} রেখা) থেকে স্প্রিংয়ের মাথা কত দূর সরেছে (কমলা দাগ)। টানা বা চাপা, x একটি দূরত্ব; সূত্রে মিটারে বসাও।',
    why_sq:
      '<b>x<sup>{two}</sup> = x × x = {xm} × {xm} = {x2}</b>। x দ্বিগুণ হলে x<sup>{two}</sup> চার গুণ ({two} × {two} = {four})। তাই সবুজ দাগ (বল) সমান তালে বাড়ে, বেগুনি দাগ (শক্তি) পরে অনেক দ্রুত।',
    why_half:
      '<b>{half} কেন?</b> টানার শুরুতে বল {z}, শেষে kx = {F} N; গড়ে {half}kx। কাজ = গড় বল × দূরত্ব = {half}kx × x = {half}kx<sup>{two}</sup>। এই কাজটুকুই স্প্রিংয়ে জমা থাকে।',
    why_V:
      '<b>V = {half}kx<sup>{two}</sup> = {half} × {k} × {xm}<sup>{two}</sup> = {V} J</b>: স্প্রিংয়ে সঞ্চিত বিভব শক্তি। হাত যে কাজ করেছে তা হারায়নি, স্প্রিংয়ের ভেতর লুকিয়ে আছে; ছেড়ে দিলে স্প্রিং এই শক্তিতে কাজ করতে পারে।',
    why_rest: 'এখন x = {z}: হাতলটি টেনে বা চেপে দেখো।',

    // the rule, growing with what the student has found out (everyday words first, the book's formula last)
    rule_rest: 'স্প্রিংটি তার <b>স্থির অবস্থায়</b>: x = {z}, বল নেই, শক্তিও জমা নেই। হাতলটি টেনে বা চেপে দেখো; সূত্রের রঙিন অক্ষর ছুঁলে ছবিতে তার অংশটি জ্বলে ওঠে।',
    rule_rest_after: 'আবার <b>স্থির অবস্থা</b>, x = {z}: বল {z}, সঞ্চিত শক্তিও {z}। যে শক্তি জমা ছিল, স্প্রিং ফিরে আসার সময় তা হাতকে ফিরিয়ে দিয়েছে।',
    rule_stretched:
      'হাত বাইরে টানছে (F<sub>P</sub>), স্প্রিং উল্টো দিকে ভেতরে টানছে (F<sub>S</sub>): <b>দুটো বল সমান, বিপরীত</b>। স্প্রিং সবসময় x = {z}-তে ফিরতে চায়। টানতে যে কাজ হলো, তা স্প্রিংয়ে জমা আছে।',
    rule_compressed:
      'চাপলে স্প্রিং উল্টো দিকে, বাইরে ঠেলে (F<sub>S</sub>)। হাত বা স্প্রিং কোনোটাই নড়ছে না, তবু ভেতরে শক্তি লুকিয়ে আছে: <b>এই সঞ্চিত শক্তিকে বলে বিভব শক্তি</b>।',
    rule_times: 'x {n} গুণ ({x1} → {x2} cm): বল <b>{n} গুণ</b> ({F1} → {F2} N), কিন্তু বিভব শক্তি <b>{nn} গুণ</b> ({V1} → {V2} J), কারণ {n} × {n} = {nn}।',
    rule_law:
      '<b>স্প্রিংয়ের ধ্রুবক k, স্থির অবস্থার সাপেক্ষে x দূরত্ব: সঞ্চিত শক্তি V = {half}kx<sup>{two}</sup></b>। x দ্বিগুণ হলে শক্তি চার গুণ; শক্ত স্প্রিংয়ে (k বড়) বেশি শক্তি।',

    // labels on the picture
    l_zero: 'x = {z}',
    l_x: 'x = {x} cm',
    l_FP: 'F<sub>P</sub> = {F} N',
    l_FS: 'F<sub>S</sub> = {F} N',
    l_FP_only: 'F<sub>P</sub>',
    l_V: 'V = {V} J',
    l_k: 'k = {k} N/m',
    note: 'তীরের দৈর্ঘ্য বলের সমানুপাতিক',
    note_short: 'তীর ∝ বল',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    // 1: which way the spring's force points
    q_dir: 'হাত স্প্রিংটিকে চেপে ধরে আছে (সবুজ তীর)। স্প্রিংয়ের নিজের বল কোন দিকে?',
    c_out: 'বাইরে, হাতের দিকে',
    c_in: 'ভেতরে, দেয়ালের দিকে',
    c_none: 'কোনো দিকে নয়, সব স্থির',
    c_down: 'নিচে, টেবিলের দিকে',
    r_dir: '<b>বাইরে, হাতের দিকে</b> (F<sub>S</sub>): স্প্রিংয়ের বল সবসময় x = {z}-এর দিকে। চাপলে বাইরে ঠেলে, টানলে ভেতরে টানে।',
    m_in: 'দেয়ালের দিকে ঠেলছে হাত (F<sub>P</sub>); স্প্রিংয়ের বল তার উল্টো দিকে।',
    m_none: 'সব স্থির, কারণ দুটো বল সমান ও বিপরীত; বল ঠিকই আছে।',
    m_down: 'স্প্রিংয়ের বল তার দৈর্ঘ্য বরাবর, ওপর-নিচে নয়।',

    // 2: the force from x shown in the picture
    q_F: 'এই স্প্রিংয়ের ধ্রুবক k = {k} N/m। ছবিতে x দেখে বলো, হাত কত বলে টেনে ধরে আছে?',
    r_F: '<b>{F} N</b>: x = {x} cm = {xm} m, তাই F = kx = {k} × {xm} = {F} N।',
    m_cm: 'x আগে মিটারে নিতে হয় ({h} cm = {one} m)।',
    m_halfF: '{half} থাকে শক্তির সূত্রে (V = {half}kx<sup>{two}</sup>), বলের সূত্রে নয় (F = kx)।',
    m_sqF: 'বলের সূত্রে x-এর বর্গ নেই: F = kx।',
    m_div: 'k-কে x দিয়ে গুণ করতে হয়, ভাগ নয়।',

    // 3: the energy from x shown in the picture
    q_V: 'এই স্প্রিংয়ের ধ্রুবক k = {k} N/m। ছবিতে x দেখে বলো, স্প্রিংয়ে কত বিভব শক্তি সঞ্চিত আছে?',
    r_V: '<b>{V} J</b>: x = {xm} m, তাই V = {half}kx<sup>{two}</sup> = {half} × {k} × {xm}<sup>{two}</sup> = {V} J।',
    m_noHalf: '{half} বাদ পড়েছে: V = {half}kx<sup>{two}</sup>।',
    m_noSq: 'x-এর বর্গ নিতে হয়: V = {half}kx<sup>{two}</sup>।',
    m_isF: 'এটি বল F = kx (N-এ), শক্তি নয়।',
    m_cmV: 'x আগে মিটারে নিতে হয় ({h} cm = {one} m)।',

    // 4: x doubled or tripled
    q_times: 'এই স্প্রিংটি {x1} cm চাপলে {V1} J শক্তি সঞ্চিত হয়। ছবিতে x দেখো: এখন কত শক্তি সঞ্চিত?',
    r_times: '<b>{V2} J</b>: x = {x2} cm, আগের {n} গুণ; শক্তি {n} × {n} = {nn} গুণ: {V1} × {nn} = {V2} J।',
    m_lin: 'বল x-এর সমানুপাতিক, কিন্তু শক্তি x<sup>{two}</sup>-এর: x {n} গুণ হলে শক্তি {nn} গুণ।',
    m_cube: 'x<sup>{two}</sup>, x<sup>{three}</sup> নয়: শক্তি {nn} গুণ।',
    m_same: 'x বেড়েছে, তাই সঞ্চিত শক্তিও বেড়েছে।',

    // 5: stretched or squeezed by the same x
    q_same: 'টেনে {x} cm লম্বা করায় ছবির স্প্রিংয়ে {V} J শক্তি সঞ্চিত। একই {x} cm চেপে সংকুচিত করলে কত হবে?',
    r_same: '<b>{V} J, একই</b>: V = {half}kx<sup>{two}</sup>-এ x-এর বর্গ; টানা বা চাপা, x সমান হলে শক্তিও সমান।',
    m_neg: 'চাপলে দিক উল্টো, কিন্তু x<sup>{two}</sup> সবসময় ধনাত্মক; সঞ্চিত শক্তিও ধনাত্মক।',
    m_zero: 'চাপতেও কাজ করতে হয়; বই বলছে, সংকুচিত স্প্রিংয়ের ভেতর শক্তি লুকিয়ে থাকে।',
    m_twice: 'একই k, একই x: শক্তি একই, দ্বিগুণ নয়।',
  },
  en: {
    title: 'Potential energy of a spring',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Potential energy',

    u_N: 'N',
    u_Nm: 'N/m',
    u_cm: 'cm',
    u_m: 'm',
    u_J: 'J',

    examples: 'The spring',
    ex_rest: 'At rest',
    ex_stretched: 'Pulled out',
    ex_compressed: 'Pushed in',
    res_J: '{V} J',

    calc: 'Change x and k',
    calc_x: 'Distance x',
    calc_k: 'Constant k',
    x_down: 'Shorter spring (toward the wall)',
    x_up: 'Longer spring (outward)',
    k_down: 'Softer spring (smaller k)',
    k_up: 'Stiffer spring (larger k)',

    act_pull5: 'Pull it out {x} cm',
    act_double: 'Pull twice as far',
    act_push: 'Now push it in',
    act_release: 'Let it back gently',
    act_again: 'Pull it out again',
    act_home: 'Back to rest',
    drag_hint: 'Drag the handle out or in with a finger',

    fx: 'The formulas: tap any letter to see where it is in the picture',
    w_F: 'Force',
    w_V: 'Potential energy',
    half: '{half}',
    sym_F: 'F: the force (the arrows)',
    sym_k: 'k: the spring constant (the spring)',
    sym_x: 'x: the distance (the orange mark)',
    sym_half: 'Why one half',
    sym_sq: 'x squared',
    sym_V: 'V: the potential energy',
    why_F:
      '<b>F = kx = {k} × {xm} = {F} N</b>: the hand’s pull or push (green arrow F<sub>P</sub>); the spring pulls back just as hard (blue arrow F<sub>S</sub>). Larger x, larger force.',
    why_k:
      '<b>k = {k} N/m</b>: the spring constant, how stiff the spring is. A stiffer spring (larger k) needs more force for the same x and stores more energy.',
    why_x:
      '<b>x = {x} cm = {xm} m</b>: how far the end has moved from rest (the x = {z} line; the orange mark). Pulled or pushed, x is a distance; use metres in the formula.',
    why_sq:
      '<b>x<sup>{two}</sup> = x × x = {xm} × {xm} = {x2}</b>. Twice x, four times x<sup>{two}</sup> ({two} × {two} = {four}): the green bar (force) grows evenly, the purple bar (energy) faster and faster.',
    why_half:
      '<b>Why {half}?</b> The force grows from {z} to kx = {F} N as you pull, {half}kx on average. Work = average force × distance = {half}kx × x = {half}kx<sup>{two}</sup>, stored in the spring.',
    why_V:
      '<b>V = {half}kx<sup>{two}</sup> = {half} × {k} × {xm}<sup>{two}</sup> = {V} J</b>: the energy stored in the spring. The hand’s work is not lost: let go, and the spring can do work with it.',
    why_rest: 'Now x = {z}: pull the handle out or push it in.',

    rule_rest:
      'The spring is <b>at rest</b>: x = {z}, no force, no stored energy. Pull or push the handle, or tap a letter of the formula to see it in the picture.',
    rule_rest_after:
      '<b>At rest</b> again, x = {z}: no force and no stored energy. The energy that was stored went back into the hand as the spring came back.',
    rule_stretched:
      'The hand pulls out (F<sub>P</sub>), the spring pulls back in (F<sub>S</sub>): <b>equal, opposite forces</b>. The spring always heads back to x = {z}; the work of pulling is stored in it.',
    rule_compressed:
      'Pushed in, the spring pushes back out (F<sub>S</sub>). Nothing moves, yet energy hides inside: <b>this stored energy is called potential energy</b>.',
    rule_times:
      'x is {n} times ({x1} → {x2} cm): the force is <b>{n} times</b> ({F1} → {F2} N), but the potential energy is <b>{nn} times</b> ({V1} → {V2} J), because {n} × {n} = {nn}.',
    rule_law:
      '<b>A spring of constant k, moved x from its rest position, stores V = {half}kx<sup>{two}</sup></b>. Twice x, four times the energy; a stiffer spring (larger k) stores more.',

    l_zero: 'x = {z}',
    l_x: 'x = {x} cm',
    l_FP: 'F<sub>P</sub> = {F} N',
    l_FS: 'F<sub>S</sub> = {F} N',
    l_FP_only: 'F<sub>P</sub>',
    l_V: 'V = {V} J',
    l_k: 'k = {k} N/m',
    note: 'Arrow lengths are proportional to the forces',
    note_short: 'Arrow ∝ force',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Read the picture and pick an answer.',

    q_dir: 'The hand holds the spring pushed in (green arrow). Which way does the spring’s force point?',
    c_out: 'Outward, toward the hand',
    c_in: 'Inward, toward the wall',
    c_none: 'Nowhere, all is still',
    c_down: 'Down, toward the bench',
    r_dir:
      '<b>Outward, toward the hand</b> (F<sub>S</sub>): the spring’s force always points toward x = {z}. Pushed in, it pushes out; pulled out, it pulls in.',
    m_in: 'The hand pushes toward the wall (F<sub>P</sub>); the spring’s force is the opposite.',
    m_none: 'All is still because the two forces are equal and opposite; the forces are there.',
    m_down: 'The spring’s force acts along its length, not up or down.',

    q_F: 'This spring has k = {k} N/m. Read x in the picture: how hard does the hand pull?',
    r_F: '<b>{F} N</b>: x = {x} cm = {xm} m, so F = kx = {k} × {xm} = {F} N.',
    m_cm: 'Turn x into metres first ({h} cm = {one} m).',
    m_halfF: 'The {half} belongs to the energy (V = {half}kx<sup>{two}</sup>), not the force (F = kx).',
    m_sqF: 'The force has no square: F = kx.',
    m_div: 'Multiply k by x, don’t divide.',

    q_V: 'This spring has k = {k} N/m. Read x in the picture: how much energy does it store?',
    r_V: '<b>{V} J</b>: x = {xm} m, so V = {half}kx<sup>{two}</sup> = {half} × {k} × {xm}<sup>{two}</sup> = {V} J.',
    m_noHalf: 'The {half} was left out: V = {half}kx<sup>{two}</sup>.',
    m_noSq: 'x must be squared: V = {half}kx<sup>{two}</sup>.',
    m_isF: 'That is the force F = kx (in N), not the energy.',
    m_cmV: 'Turn x into metres first ({h} cm = {one} m).',

    q_times: 'Pushed in {x1} cm, this spring stores {V1} J. Look at x in the picture: how much does it store now?',
    r_times: '<b>{V2} J</b>: x = {x2} cm, {n} times as much; the energy is {n} × {n} = {nn} times: {V1} × {nn} = {V2} J.',
    m_lin: 'The force goes as x, but the energy as x<sup>{two}</sup>: {n} times x is {nn} times the energy.',
    m_cube: 'x<sup>{two}</sup>, not x<sup>{three}</sup>: {nn} times the energy.',
    m_same: 'x grew, so the stored energy grew too.',

    q_same: 'Pulled out {x} cm, the spring in the picture stores {V} J. Pushed in the same {x} cm, how much?',
    r_same: '<b>{V} J, the same</b>: V = {half}kx<sup>{two}</sup> has x squared; pulled or pushed, the same x stores the same energy.',
    m_neg: 'Pushing reverses the direction, but x<sup>{two}</sup> is always positive, and so is the stored energy.',
    m_zero: 'Pushing in also takes work; the book says energy hides inside a squeezed spring.',
    m_twice: 'Same k, same x: the same energy, not twice.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/** The book's stacked ½ (Noto Sans Bengali has no ½ glyph). */
const HALF = '<span class="sp-fr" aria-label="1/2"><span>1</span><span>2</span></span>';

/** t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    const s = dict[key] ?? key;
    const all = { z: 0, one: 1, two: 2, three: 3, four: 4, h: 100, half: HALF, ...vars }; // these follow the digits too
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in all ? num(all[k]) : m));
  }
  t.num = num;
  t.lang = code;
  return t;
}
