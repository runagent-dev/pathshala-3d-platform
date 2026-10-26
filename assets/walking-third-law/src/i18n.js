// Every string the figure shows, in Bangla (the book's words, page 86, topic 3.8: নিউটনের তৃতীয় সূত্র, আমরা কীভাবে
// হাঁটি, পা দিয়ে মাটিতে ধাক্কা দিই (বল প্রয়োগ করি), সমান এবং বিপরীত বল, প্রতিক্রিয়া, ত্বরণ, ঘর্ষণ, পিচ্ছিল) and
// English. Forces are "নিউটন" (docs/book-notes.md). Use t('key') in code, and t.num() for numbers (Bangla digits when
// the language is Bangla).

const B = (x) => `<b>${x}</b>`;

export const STRINGS = {
  bn: {
    title: 'হাঁটা ও নিউটনের তৃতীয় সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'পাশ থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ধাক্কা',

    // the row of words: where we walk (the page's three grounds); under each, once tried, the push
    ex_label: 'কোথায় হাঁটছি',
    chip_hard: 'শক্ত মাটি',
    chip_sand: 'ঝুরঝুরে বালু',
    chip_slip: 'পিচ্ছিল মেঝে',
    res_push: '{n} নিউটন',

    // the one action
    act_hard: 'শক্ত মাটিতে পা দিয়ে ধাক্কা দাও',
    act_sand: 'বালুতে পা দিয়ে ধাক্কা দাও',
    act_slip: 'পিচ্ছিল মেঝেতে পা দিয়ে ধাক্কা দাও',
    act_again: 'আবার ধাক্কা দাও',
    act_home: 'শুরুতে ফেরাও',

    // the one result line: waiting, pushing, and the held moment (the forces are the same size: F and −F)
    out_rest_hard: 'শক্ত মাটিতে মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_rest_sand: 'বালুর উপর মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_rest_slip: 'পিচ্ছিল মেঝেতে মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_push: 'পা মাটিকে ঠেলছে…',
    out_hard: `পা মাটিকে ঠেলল, মাটি মানুষটিকে ঠেলল। দুটি ঠেলাই সমান: ${B('{n} নিউটন')}।`,
    out_sand: `বালু সরে গেল। দুটি ঠেলাই সমান, কিন্তু কম: ${B('{n} নিউটন')}।`,
    out_slip: `পা পিছলে গেল। দুটি ঠেলাই সমান, কিন্তু খুব কম: ${B('{n} নিউটন')}।`,

    // the one rule: the page's own sentences, as the student finds each ground
    rule_start: `হাঁটার সময় ${B('কেউ আমাদের ঠেলে না')}, তবু আমরা এগোই। কীভাবে?`,
    rule_hard: `${B('পা মাটিকে পেছনে ঠেলে, তাই মাটি আমাদের সামনে ঠেলে।')} এতেই আমরা এগোই।`,
    rule_sand: `${B('বালু সরে যায়')}, তাই পা বেশি ঠেলতে পারে না। ঠেলা কম, তাই মাটির ঠেলাও কম।`,
    rule_slip: `${B('ঘর্ষণ খুব কম')}, তাই পা পিছলে যায়। পা মাটিকে ঠেলতে না পারলে মাটিও আমাদের ঠেলে না।`,
    rule_all: `${B('বল প্রয়োগ করলে বিপরীত এবং সমান বল পাওয়া যায়')}: এটাই নিউটনের তৃতীয় সূত্র। বইয়ে ঠেলা দুটির নাম F আর −F।`,

    // in the 3D view: the two forces, named where they act; the start line; how time is shown
    l_f: 'পা মাটিকে ঠেলছে',
    l_mf: 'মাটি মানুষটিকে ঠেলছে',
    l_start: 'শুরু',
    note_slow: 'সময় {k} গুণ ধীর করে দেখানো',
    note_held: 'থামিয়ে দেখানো',
    q_locked: 'পরীক্ষার সময় ধাক্কা দেওয়া যায় না। ছবি দেখে উত্তর বেছে নাও।',

    // the test
    letters: 'কখ',
    q_which: 'মানুষটি হাঁটতে শুরু করেছে। ছবির কোন তীরটি তাকে সামনে এগিয়ে নিচ্ছে?',
    w_arrow: '{k} তীরটি',
    w_both: 'দুটি তীরই',
    w_self: 'কোনোটিই নয়, নিজেই নিজেকে ঠেলছে',
    why_which: `${B('{k} তীরটি')}: ছবিতে দেখো, এটি মানুষটিকে সামনে ঠেলছে, এটা মাটির ঠেলা। {o} তীরটি মাটিকে পেছনে ঠেলছে।`,
    miss_w_ground: `${B('{k} তীরটি')}, {o} নয়: {o} তীরটি পায়ের ঠেলা, যা কাজ করছে মাটির উপর। মানুষটিকে ঠেলছে মাটি।`,
    miss_w_both: `${B('{k} তীরটি')}: {o} তীরটি মাটির উপর কাজ করছে, মানুষটির উপর নয়। তাই সেটি মানুষটিকে এগিয়ে নেয় না।`,
    miss_w_self: `${B('{k} তীরটি')}: ভেতরের বলে কেউ নিজেকে ঠেলে এগোতে পারে না। মাটি পাল্টা ঠেলে বলেই আমরা হাঁটি।`,

    q_equal: 'ছবিতে লেখা আছে, পা মাটিকে কত নিউটন ঠেলছে। মাটি মানুষটিকে কত নিউটন ঠেলছে?',
    e_val: '{n} নিউটন',
    why_equal: `${B('{n} নিউটন')}, সমান: পা মাটিকে যত জোরে ঠেলে, মাটিও মানুষটিকে তত জোরেই ঠেলে। তীর দুটি সমান লম্বা।`,
    miss_e_double: `${B('{n} নিউটন')}, দ্বিগুণ নয়: মাটি বড় বলে বেশি ঠেলে না। দুটি ঠেলাই সমান, তীর দুটিও সমান লম্বা।`,
    miss_e_half: `${B('{n} নিউটন')}, অর্ধেক নয়: ঠেলা ভাগ হয় না। পা মাটিকে যত ঠেলে, মাটিও মানুষটিকে তত ঠেলে।`,
    miss_e_zero: `${B('{n} নিউটন')}, শূন্য নয়: মাটি নড়ে না বলে ঠেলা নেই, তা নয়। মাটি পাল্টা ঠেলে বলেই মানুষটি এগোয়।`,

    q_cancel: 'দুটি ঠেলা সমান আর উল্টো দিকে। তবু মানুষটি এগোয়। কেন?',
    c_bodies: 'একটি মাটির উপর, একটি মানুষটির উপর',
    c_bigger: 'মাটির ঠেলা পায়ের ঠেলার চেয়ে বেশি',
    c_inertia: 'ঠেলা কেটে যায়, জড়তায় এগোয়',
    c_muscle: 'পেশির নিজের বল বাকিটা জোগায়',
    why_cancel: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ঠেলা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না। মানুষটিকে এগিয়ে নেয় শুধু মাটির ঠেলা।`,
    miss_c_bigger: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ঠেলা দুটি সমান, তীর দুটিও সমান লম্বা। কিন্তু ঠেলা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না।`,
    miss_c_inertia: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ঠেলা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না। মাটির ঠেলাতেই মানুষটি এগোয়।`,
    miss_c_muscle: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: নিজের ভেতরের বলে কেউ নিজেকে এগোতে পারে না। বাইরে থেকে মানুষটিকে ঠেলে শুধু মাটি।`,

    q_slip: 'মেঝেটি সাবান-পানিতে পিচ্ছিল। মানুষটি পা দিয়ে ঠেলল, কিন্তু প্রায় এগোল না। কেন?',
    s_friction: 'ঘর্ষণ খুব কম, তাই পা পিছলে যায়',
    s_back: 'মেঝে মানুষটিকে পেছনে টানছে',
    s_law: 'এখানে তৃতীয় সূত্র খাটে না',
    s_weak: 'মানুষটি জোরে ঠেলেনি',
    why_slip: `${B('ঘর্ষণ খুব কম')}: পা পেছনে পিছলে গেছে (ছবিতে দেখো), তাই মাটিকে প্রায় ঠেলতেই পারেনি। মাটিকে না ঠেললে মাটিও ঠেলে না, তাই এগোনো যায় না।`,
    miss_s_back: `${B('ঘর্ষণ খুব কম')}: মেঝে পেছনে টানছে না। পা পিছলে গেছে (ছবিতে দেখো), তাই মাটিকে ঠেলতেই পারেনি, মাটিও সামনে ঠেলেনি।`,
    miss_s_law: `${B('ঘর্ষণ খুব কম')}: তৃতীয় সূত্র সব জায়গায় খাটে, কিন্তু ঠেলতে না পারলে পাল্টা ঠেলাও থাকে না। পা পিছলে গেছে (ছবিতে দেখো)।`,
    miss_s_weak: `${B('ঘর্ষণ খুব কম')}: জোরে ঠেলতে চাইলেও পা পিছলে যায় (ছবিতে দেখো), মাটিকে ঠেলাই যায় না। তাই পাল্টা ঠেলাও মেলে না।`,

    q_sand: 'বালুতে পা ঠেলতেই বালু সরে গেল। শক্ত মাটির তুলনায় মাটির ঠেলা কেমন?',
    d_less: 'কম: বালু সরে যায়, তাই ঠেলাও কম',
    d_same: 'সমান: সব মাটিতে ঠেলা একই',
    d_more: 'বেশি: নরম বালু বেশি ঠেলে',
    d_none: 'কোনো ঠেলাই নেই',
    why_sand: `${B('কম')}: বালু সরে যায়, তাই পা মাটিকে বেশি ঠেলতে পারে না। ঠেলা কম হলে মাটির ঠেলাও কম: শক্ত মাটিতে {a} নিউটন, বালুতে {b} নিউটন।`,
    miss_d_same: `${B('কম')}: বালু সরে যায় (ছবিতে দেখো), তাই পা বেশি ঠেলতে পারে না। শক্ত মাটির {a} নিউটনের জায়গায় মাটির ঠেলা {b} নিউটন।`,
    miss_d_more: `${B('কম')}: নরম বলে বালু বেশি ঠেলে না, সরে যায় (ছবিতে দেখো)। শক্ত মাটির {a} নিউটনের জায়গায় মাটির ঠেলা {b} নিউটন।`,
    miss_d_none: `${B('কম')}, শূন্য নয়: বালুতে পা কিছুটা ঠেলতে পারে, তাই মাটিও {b} নিউটন ঠেলে। শক্ত মাটিতে তা {a} নিউটন।`,

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখে, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
  },
  en: {
    title: 'How we walk: the third law',
    view: 'View',
    view_front_short: 'Side',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Push',

    ex_label: 'Where we walk',
    chip_hard: 'Firm ground',
    chip_sand: 'Loose sand',
    chip_slip: 'Slippery floor',
    res_push: '{n} N',

    act_hard: 'Push the firm ground with a foot',
    act_sand: 'Push the sand with a foot',
    act_slip: 'Push the slippery floor with a foot',
    act_again: 'Push again',
    act_home: 'Back to start',

    out_rest_hard: 'The student stands still on firm ground.',
    out_rest_sand: 'The student stands still on sand.',
    out_rest_slip: 'The student stands still on the slippery floor.',
    out_push: 'The foot pushes the ground…',
    out_hard: `The foot pushed the ground, the ground pushed the student. Both pushes are equal: ${B('{n} N')}.`,
    out_sand: `The sand gave way. Both pushes are equal, but smaller: ${B('{n} N')}.`,
    out_slip: `The foot slipped. Both pushes are equal, but very small: ${B('{n} N')}.`,

    rule_start: `Nobody pushes us when we walk, yet we ${B('move forward')}. How?`,
    rule_hard: `${B('The foot pushes the ground backward, so the ground pushes us forward.')} That is how we move.`,
    rule_sand: `${B('Sand gives way')}, so the foot cannot push hard. A small push means a small push back.`,
    rule_slip: `${B('Friction is very small')}, so the foot slips. If we cannot push the ground, it does not push us: we cannot walk.`,
    rule_all: `${B('Apply a force and you get an opposite and equal force')}: that is Newton’s third law. In the book the two pushes are called F and −F.`,

    l_f: 'The foot pushes the ground',
    l_mf: 'The ground pushes the student',
    l_start: 'start',
    note_slow: 'Time shown {k} times slower',
    note_held: 'Paused',
    q_locked: 'You cannot push during the test. Look at the picture and pick an answer.',

    letters: 'AB',
    q_which: 'The student has started to walk. Which arrow in the picture moves them forward?',
    w_arrow: 'Arrow {k}',
    w_both: 'Both arrows',
    w_self: 'Neither: they push themselves',
    why_which: `${B('Arrow {k}')}: look, it pushes the student forward. That is the ground’s push. Arrow {o} pushes the ground backward.`,
    miss_w_ground: `${B('Arrow {k}')}, not {o}: arrow {o} is the foot’s push, which acts on the ground. The ground pushes the student.`,
    miss_w_both: `${B('Arrow {k}')}: arrow {o} acts on the ground, not on the student, so it does not move the student.`,
    miss_w_self: `${B('Arrow {k}')}: nobody can push themselves forward with a force from inside. We walk because the ground pushes back.`,

    q_equal: 'The picture says how hard the foot pushes the ground. How hard does the ground push the student?',
    e_val: '{n} N',
    why_equal: `${B('{n} N')}, equal: the ground pushes the student exactly as hard as the foot pushes the ground. The arrows are equally long.`,
    miss_e_double: `${B('{n} N')}, not double: a big ground does not push harder. The pushes are equal; the arrows are equally long.`,
    miss_e_half: `${B('{n} N')}, not half: a push does not get shared out. The ground pushes as much as the foot pushes it.`,
    miss_e_zero: `${B('{n} N')}, not zero: the ground not moving does not mean no push. The ground pushes back, so the student moves forward.`,

    q_cancel: 'The two pushes are equal and opposite. Yet the student moves forward. Why?',
    c_bodies: 'One acts on the ground, one on the student',
    c_bigger: 'The ground’s push is bigger than the foot’s',
    c_inertia: 'They cancel; inertia carries on',
    c_muscle: 'Muscle force supplies the rest',
    why_cancel: `${B('One on the ground, one on the student')}: the two pushes act on different things, so they do not cancel. Only the ground’s push moves the student forward.`,
    miss_c_bigger: `${B('One on the ground, one on the student')}: the pushes are equal, the arrows equally long. But they act on different things, so they do not cancel.`,
    miss_c_inertia: `${B('One on the ground, one on the student')}: the pushes act on different things, so they do not cancel. The ground’s push moves the student.`,
    miss_c_muscle: `${B('One on the ground, one on the student')}: nobody can move forward by a force from inside. From outside only the ground pushes the student.`,

    q_slip: 'The floor is slippery with soapy water. The student pushes with a foot but hardly moves. Why?',
    s_friction: 'Friction is very small, so the foot slides',
    s_back: 'The floor pulls the student backward',
    s_law: 'The third law does not work here',
    s_weak: 'The student did not push hard',
    why_slip: `${B('Friction is very small')}: the foot slid backward (look at the picture), so it could hardly push the ground. If the ground is not pushed it does not push back, so we cannot go forward.`,
    miss_s_back: `${B('Friction is very small')}: the floor is not pulling backward. The foot slid (look at the picture), so it could not push the ground and the ground did not push forward.`,
    miss_s_law: `${B('Friction is very small')}: the third law works everywhere, but if we cannot push there is no push back. The foot slid (look at the picture).`,
    miss_s_weak: `${B('Friction is very small')}: even when pushing hard the foot slides (look at the picture) and cannot push the ground. So there is no push back.`,

    q_sand: 'The foot pushes and the sand gives way. Compared with firm ground, how is the ground’s push?',
    d_less: 'Less: the sand gives way, so the push is less too',
    d_same: 'The same on every ground',
    d_more: 'More: soft sand pushes harder',
    d_none: 'There is no push',
    why_sand: `${B('Less')}: the sand gives way, so the foot cannot push the ground hard. A smaller push means a smaller push back: {a} N on firm ground, {b} N on sand.`,
    miss_d_same: `${B('Less')}: the sand gives way (look at the picture), so the foot cannot push as hard. Instead of {a} N on firm ground the ground pushes {b} N.`,
    miss_d_more: `${B('Less')}: soft does not mean pushing harder; the sand gives way (look at the picture). Instead of {a} N on firm ground the ground pushes {b} N.`,
    miss_d_none: `${B('Less')}, not nothing: on sand the foot can push a little, so the ground pushes back with {b} N. On firm ground it is {a} N.`,

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
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
