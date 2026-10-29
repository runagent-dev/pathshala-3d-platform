// Every string the figure shows, in Bangla (the book's words, page 86, topic 3.8: নিউটনের তৃতীয় সূত্র, আমরা কীভাবে
// হাঁটি, পা দিয়ে মাটিতে ধাক্কা দিই (বল প্রয়োগ করি), সমান এবং বিপরীত বল, প্রতিক্রিয়া, ত্বরণ, ঘর্ষণ, পিচ্ছিল) and
// English. Everyday words first, one verb everywhere (ধাক্কা, the page's own), the book's sentence and the symbols F and
// −F last. Forces are "নিউটন" (docs/book-notes.md). Use t('key') in code, and t.num() for numbers (Bangla digits when
// the language is Bangla).

const B = (x) => `<b>${x}</b>`;

export const STRINGS = {
  bn: {
    explain_tab_pair: 'সমান ও বিপরীত বল',
    explain_tab_grip: 'তীর ও ঘর্ষণ',
    l_ground_compact: 'মাটির উপর ←',
    l_person_compact: 'মানুষের উপর →',
    act_pause: 'থামিয়ে দেখো',
    act_resume: 'চালিয়ে যাও',
    timeline: 'ধাক্কার মুহূর্ত',
    timeline_time: 'প্রকৃত সময়: {time} s',
    step_0: 'পা রাখো',
    step_1: 'দুটি ধাক্কা',
    step_2: 'এগিয়ে যাও',
    pair_title: 'দুটি বল: একই সময়ে',
    explain_link: 'কেন কাটে না?',
    on_ground: 'পা → মাটির উপর',
    on_person: 'মাটি → মানুষের উপর',
    live_acceleration: 'মানুষের ত্বরণ: a = {force}/{mass} = {a} ms<sup>−{two}</sup>',
    live_motion: 'এগিয়েছে {moved} m · পা পিছলেছে {slip} m',
    contact_title: 'পা ও মাটির স্পর্শ: বড় করে',
    note_paused: 'মুহূর্তটি থামিয়ে দেখানো',
    explain_title: 'মাটির ধাক্কায় আমরা এগোই',
    explain_simultaneous: 'পা মাটিকে পেছনে ধাক্কা দেয়। একই সময়ে মাটিও পাকে সামনে ধাক্কা দেয়। প্রতিক্রিয়া পাওয়ার জন্য অপেক্ষা করতে হয় না।',
    ground_body: 'মাটির উপর বল',
    person_body: 'মানুষের উপর বল',
    explain_ground: 'কমলা তীর: পা মাটিকে পেছনে ধাক্কা দেয়। এই বল মাটির উপর কাজ করে।',
    explain_person: 'লাল তীর: মাটি পাকে সামনে ধাক্কা দেয়। ঘর্ষণের এই বল মানুষটিকে সামনে এগিয়ে নেয়।',
    explain_cancel: 'মান সমান, দিক বিপরীত; কিন্তু বল দুটি ভিন্ন বস্তুর উপর। তাই মানুষটির উপর বল দুটি কাটাকাটি হয় না।',
    explain_arrow: 'তীরের মাথা বলের দিক বোঝায়। একই দৃশ্যে সমান দৈর্ঘ্য মানে সমান বল। বালু বা পিচ্ছিল মেঝেতে দুটি তীরই ছোট হয়, তবুও সমান থাকে।',
    explain_friction:
      'শক্ত মাটিতে পা আটকে থাকে: স্থিতি ঘর্ষণ পিছলানো আটকায়। বালু সরে যায় বা পিচ্ছিল মেঝেতে ঘর্ষণ কম হলে পা পিছলে যায়; সামনে যাওয়ার বলও কমে। সূত্রটি তখনও কাজ করে।',
    explain_model: 'একটি ধাক্কার শুরুর সরল মডেল: মানুষের ভর {mass} kg। কেবল অনুভূমিক বল দেখানো। পায়ের দৃশ্য বড় করে, সময় {slow} গুণ ধীর করে দেখানো; সংখ্যাগুলি উদাহরণ।',
    explain_close: 'ফিরে যাও',
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
    act_slip: 'পিচ্ছিল মেঝেতে ধাক্কা দাও',
    act_again: 'আবার ধাক্কা দাও',
    act_home: 'শুরুতে ফেরাও',

    // the one result line: waiting, pushing, and the held moment (the two pushes are the same size; the numbers are an
    // example: "যেমন")
    out_rest_hard: 'শক্ত মাটিতে মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_rest_sand: 'বালুর উপর মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_rest_slip: 'পিচ্ছিল মেঝেতে মানুষটি স্থির দাঁড়িয়ে আছে।',
    out_push: 'পা মাটিকে ধাক্কা দিচ্ছে…',
    out_hard: `পা মাটিকে ধাক্কা দিল, মাটি মানুষটিকে ধাক্কা দিল। দুটি ধাক্কাই সমান, যেমন ${B('{n} নিউটন')}।`,
    out_sand: `বালু সরে গেল। দুটি ধাক্কাই সমান, কিন্তু কম, যেমন ${B('{n} নিউটন')}।`,
    out_slip: `পা পিছলে গেল। দুটি ধাক্কাই সমান, কিন্তু খুব কম, যেমন ${B('{n} নিউটন')}।`,

    // the one rule, one short sentence per idea: the puzzle, what each ground shows, and the book's sentence last
    rule_start: `হাঁটার সময় ${B('কেউ আমাদের ধাক্কা দেয় না')}, তবু আমরা এগোই। কীভাবে?`,
    rule_hard: `শক্ত মাটিতে পা আটকে থাকে। ${B('পা মাটিকে পেছনে, মাটি আমাদের সামনে ধাক্কা দেয়।')}`,
    rule_sand: `${B('বালু সরে যায়')}, তাই পা বেশি ধাক্কা দিতে পারে না। ধাক্কা কম, তাই মাটির ধাক্কাও কম।`,
    rule_slip: `${B('ঘর্ষণ খুব কম')}, তাই পা পিছলে যায়। মাটিকে প্রায় ধাক্কা দিতে না পারলে মাটিও প্রায় ধাক্কা দেয় না।`,
    rule_book: `${B('বল প্রয়োগ করলে বিপরীত এবং সমান বল পাওয়া যায়')}: এটাই নিউটনের তৃতীয় সূত্র।`,

    // in the 3D view: the two pushes, who pushes whom (the symbols F and −F join them at the last step); the start line;
    // how time is shown
    l_f: 'পা মাটিকে ধাক্কা দিচ্ছে',
    l_mf: 'মাটি মানুষটিকে ধাক্কা দিচ্ছে',
    l_f_short: 'পা',
    l_mf_short: 'মাটি',
    l_start: 'শুরু',
    note_slow: 'সময় {k} গুণ ধীর করে দেখানো',
    note_held: 'থামিয়ে দেখানো',

    // the test
    letters: 'কখ',
    q_which: 'মানুষটি হাঁটতে শুরু করেছে। ছবির কোন তীরটি তাকে সামনে এগিয়ে নিচ্ছে?',
    w_arrow: '{k} তীরটি',
    w_both: 'দুটি তীরই',
    w_self: 'কোনোটিই নয়, নিজেই নিজেকে ধাক্কা দিচ্ছে',
    why_which: `${B('{k} তীরটি')}: ছবিতে দেখো, এটি মানুষটিকে সামনে ধাক্কা দিচ্ছে, এটা মাটির ধাক্কা। {o} তীরটি মাটিকে পেছনে ধাক্কা দিচ্ছে।`,
    miss_w_ground: `${B('{k} তীরটি')}, {o} নয়: {o} তীরটি পায়ের ধাক্কা, যা কাজ করছে মাটির উপর। মানুষটিকে ধাক্কা দিচ্ছে মাটি।`,
    miss_w_both: `${B('{k} তীরটি')}: {o} তীরটি মাটির উপর কাজ করছে, মানুষটির উপর নয়। তাই সেটি মানুষটিকে এগিয়ে নেয় না।`,
    miss_w_self: `${B('{k} তীরটি')}: ভেতরের বলে কেউ নিজেকে এগিয়ে নিতে পারে না। মাটি পাল্টা ধাক্কা দেয় বলেই আমরা হাঁটি।`,

    q_equal: 'ছবিতে পায়ের ধাক্কার মান লেখা আছে। মাটি মানুষটিকে কত নিউটন ধাক্কা দিচ্ছে?',
    e_val: '{n} নিউটন',
    why_equal: `${B('{n} নিউটন')}, সমান: পা মাটিকে যত জোরে ধাক্কা দেয়, মাটিও মানুষটিকে তত জোরেই ধাক্কা দেয়। তীর দুটি সমান লম্বা।`,
    miss_e_double: `${B('{n} নিউটন')}, দ্বিগুণ নয়: মাটি বড় বলে বেশি ধাক্কা দেয় না। দুটি ধাক্কাই সমান, তীর দুটিও সমান লম্বা।`,
    miss_e_half: `${B('{n} নিউটন')}, অর্ধেক নয়: ধাক্কা ভাগ হয় না। পা মাটিকে যত ধাক্কা দেয়, মাটিও মানুষটিকে তত ধাক্কা দেয়।`,
    miss_e_zero: `${B('{n} নিউটন')}, শূন্য নয়: মাটি নড়ে না বলে ধাক্কা নেই, তা নয়। মাটি পাল্টা ধাক্কা দেয় বলেই মানুষটি এগোয়।`,

    q_cancel: 'ছবির দুটি ধাক্কা সমান আর উল্টো দিকে। তবু মানুষটি এগোয়। কেন?',
    c_bodies: 'একটি মাটির উপর, একটি মানুষটির উপর',
    c_bigger: 'মাটির ধাক্কা পায়ের ধাক্কার চেয়ে বেশি',
    c_inertia: 'ধাক্কা কেটে যায়, জড়তায় এগোয়',
    c_muscle: 'পেশির নিজের বল বাকিটা জোগায়',
    why_cancel: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ধাক্কা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না। মানুষটিকে এগিয়ে নেয় শুধু মাটির ধাক্কা।`,
    miss_c_bigger: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ধাক্কা দুটি সমান, তীর দুটিও সমান লম্বা। কিন্তু ধাক্কা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না।`,
    miss_c_inertia: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ধাক্কা দুটি আলাদা জিনিসের উপর, তাই কাটাকাটি হয় না। মাটির ধাক্কাতেই মানুষটি এগোয়।`,
    miss_c_muscle: `${B('একটি মাটির উপর, একটি মানুষটির উপর')}: ভেতরের বলে কেউ নিজেকে এগিয়ে নিতে পারে না। বাইরে থেকে মানুষটিকে ধাক্কা দেয় শুধু মাটি।`,

    q_slip: 'মানুষটি পা দিয়ে ধাক্কা দিল, কিন্তু প্রায় এগোল না (ছবি দেখো)। কেন?',
    s_friction: 'ঘর্ষণ খুব কম, পা পিছলে যায়',
    s_back: 'মেঝে মানুষটিকে পেছনে টানছে',
    s_law: 'এখানে তৃতীয় সূত্র খাটে না',
    s_weak: 'মানুষটি যথেষ্ট জোরে ধাক্কা দেয়নি',
    why_slip: `${B('ঘর্ষণ খুব কম')}: পা পেছনে পিছলে গেছে (ছবিতে দেখো), তাই মাটিকে প্রায় ধাক্কা দিতেই পারেনি। মাটিকে ধাক্কা না দিলে মাটিও ধাক্কা দেয় না, তাই এগোনো যায় না।`,
    miss_s_back: `${B('ঘর্ষণ খুব কম')}: মেঝে পেছনে টানছে না। পা পিছলে গেছে (ছবিতে দেখো), তাই মাটিকে ধাক্কা দিতেই পারেনি, মাটিও সামনে ধাক্কা দেয়নি।`,
    miss_s_law: `${B('ঘর্ষণ খুব কম')}: তৃতীয় সূত্র সব জায়গায় খাটে, কিন্তু ধাক্কা দিতে না পারলে পাল্টা ধাক্কাও থাকে না। পা পিছলে গেছে (ছবিতে দেখো)।`,
    miss_s_weak: `${B('ঘর্ষণ খুব কম')}: জোরে ধাক্কা দিতে চাইলেও পা পিছলে যায় (ছবিতে দেখো), মাটিকে ধাক্কা দেওয়াই যায় না। তাই পাল্টা ধাক্কাও মেলে না।`,

    q_who: 'ছবির মুহূর্তে মানুষটিকে সামনে ধাক্কা দিচ্ছে কে?',
    h_ground: 'মাটি',
    h_foot: 'তার নিজের পা',
    h_self: 'সে নিজেই নিজেকে',
    h_air: 'পেছনের বাতাস',
    why_who: `${B('মাটি')}: পা মাটিকে পেছনে ধাক্কা দেয়, আর মাটি পাল্টা মানুষটিকে সামনে ধাক্কা দেয়। এই ধাক্কাতেই সে এগোয়।`,
    miss_h_foot: `${B('মাটি')}, পা নয়: পা মাটিকে ধাক্কা দেয়, মানুষটিকে নয়। মানুষটিকে সামনে ধাক্কা দেয় মাটি।`,
    miss_h_self: `${B('মাটি')}: ভেতরের বলে কেউ নিজেকে এগিয়ে নিতে পারে না। বাইরে থেকে মাটি পাল্টা ধাক্কা দেয় বলেই আমরা হাঁটি।`,
    miss_h_air: `${B('মাটি')}: ছবির দুটি ধাক্কাই পা আর মাটির। বাতাস মানুষটিকে সামনে ধাক্কা দেয় না, মাটি দেয়।`,

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
    explain_tab_pair: 'The force pair',
    explain_tab_grip: 'Arrows and friction',
    l_ground_compact: 'On ground ←',
    l_person_compact: 'On person →',
    act_pause: 'Pause the moment',
    act_resume: 'Continue',
    timeline: 'Push-off timeline',
    timeline_time: 'Real time: {time} s',
    step_0: 'Plant foot',
    step_1: 'Both pushes',
    step_2: 'Move forward',
    pair_title: 'Two forces, at the same time',
    explain_link: 'Why not cancel?',
    on_ground: 'Foot → on the ground',
    on_person: 'Ground → on the person',
    live_acceleration: 'Person’s acceleration: a = {force}/{mass} = {a} ms<sup>−{two}</sup>',
    live_motion: 'Moved {moved} m · Foot slid {slip} m',
    contact_title: 'Foot–ground contact: enlarged',
    note_paused: 'Moment paused',
    explain_title: 'The ground pushes us forward',
    explain_simultaneous:
      'The foot pushes the ground backward. At the same time, the ground pushes the foot forward. There is no waiting for a reaction.',
    ground_body: 'Force on the ground',
    person_body: 'Force on the person',
    explain_ground: 'Orange arrow: the foot pushes backward. This force acts on the ground.',
    explain_person: 'Red arrow: the ground pushes the foot forward. This friction force moves the person forward.',
    explain_cancel: 'Equal magnitudes, opposite directions, but different objects. These two forces do not cancel on the person.',
    explain_arrow:
      'The arrowhead gives the force direction. Equal lengths within a view mean equal forces. Both arrows get shorter on sand or a slippery floor, but remain equal.',
    explain_friction:
      'On firm ground, static friction prevents the foot from sliding. Sand gives way, or a slippery floor provides little friction: the foot slips and the forward push is smaller. The law still holds.',
    explain_model:
      'A simplified initial push-off: a {mass} kg person. Horizontal forces only. Contact enlarged, time shown {slow} times slower; numbers are examples.',
    explain_close: 'Back to the scene',
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
    act_slip: 'Push the slippery floor',
    act_again: 'Push again',
    act_home: 'Back to start',

    out_rest_hard: 'The student stands still on firm ground.',
    out_rest_sand: 'The student stands still on sand.',
    out_rest_slip: 'The student stands still on the slippery floor.',
    out_push: 'The foot pushes the ground…',
    out_hard: `The foot pushed the ground, the ground pushed the student. Both pushes are equal, for example ${B('{n} N')}.`,
    out_sand: `The sand gave way. Both pushes are equal, but smaller, for example ${B('{n} N')}.`,
    out_slip: `The foot slipped. Both pushes are equal, but very small, for example ${B('{n} N')}.`,

    rule_start: `Nobody pushes us when we walk, yet we ${B('move forward')}. How?`,
    rule_hard: `On firm ground the foot grips. ${B('The foot pushes the ground backward, the ground pushes us forward.')}`,
    rule_sand: `${B('Sand gives way')}, so the foot cannot push hard. A small push means a small push back.`,
    rule_slip: `${B('Friction is very small')}, so the foot slips. If we can hardly push the ground, it hardly pushes us.`,
    rule_book: `${B('Apply a force and you get an opposite and equal force')}: that is Newton’s third law.`,

    l_f: 'The foot pushes the ground',
    l_mf: 'The ground pushes the student',
    l_f_short: 'foot',
    l_mf_short: 'ground',
    l_start: 'start',
    note_slow: 'Time shown {k} times slower',
    note_held: 'Paused',

    letters: 'AB',
    q_which: 'The student has started to walk. Which arrow in the picture moves them forward?',
    w_arrow: 'Arrow {k}',
    w_both: 'Both arrows',
    w_self: 'Neither: they push themselves',
    why_which: `${B('Arrow {k}')}: look, it pushes the student forward. That is the ground’s push. Arrow {o} pushes the ground backward.`,
    miss_w_ground: `${B('Arrow {k}')}, not {o}: arrow {o} is the foot’s push, which acts on the ground. The ground pushes the student.`,
    miss_w_both: `${B('Arrow {k}')}: arrow {o} acts on the ground, not on the student, so it does not move the student.`,
    miss_w_self: `${B('Arrow {k}')}: nobody can move themselves forward with a force from inside. We walk because the ground pushes back.`,

    q_equal: 'The picture says how big the foot’s push is. How big is the ground’s push on the student?',
    e_val: '{n} N',
    why_equal: `${B('{n} N')}, equal: the ground pushes the student exactly as hard as the foot pushes the ground. The arrows are equally long.`,
    miss_e_double: `${B('{n} N')}, not double: a big ground does not push harder. The pushes are equal; the arrows are equally long.`,
    miss_e_half: `${B('{n} N')}, not half: a push does not get shared out. The ground pushes as much as the foot pushes it.`,
    miss_e_zero: `${B('{n} N')}, not zero: the ground not moving does not mean no push. The ground pushes back, so the student moves forward.`,

    q_cancel: 'The two pushes in the picture are equal and opposite. Yet the student moves forward. Why?',
    c_bodies: 'One acts on the ground, one on the student',
    c_bigger: 'The ground’s push is bigger than the foot’s',
    c_inertia: 'They cancel; inertia carries on',
    c_muscle: 'Muscle force supplies the rest',
    why_cancel: `${B('One on the ground, one on the student')}: the two pushes act on different things, so they do not cancel. Only the ground’s push moves the student forward.`,
    miss_c_bigger: `${B('One on the ground, one on the student')}: the pushes are equal, the arrows equally long. But they act on different things, so they do not cancel.`,
    miss_c_inertia: `${B('One on the ground, one on the student')}: the pushes act on different things, so they do not cancel. The ground’s push moves the student.`,
    miss_c_muscle: `${B('One on the ground, one on the student')}: nobody can move forward by a force from inside. From outside only the ground pushes the student.`,

    q_slip: 'The student pushed with a foot but hardly moved (look at the picture). Why?',
    s_friction: 'Friction is very small, the foot slides',
    s_back: 'The floor pulls the student backward',
    s_law: 'The third law does not work here',
    s_weak: 'The student did not push hard',
    why_slip: `${B('Friction is very small')}: the foot slid backward (look at the picture), so it could hardly push the ground. If the ground is hardly pushed it hardly pushes back, so we cannot go forward.`,
    miss_s_back: `${B('Friction is very small')}: the floor is not pulling backward. The foot slid (look at the picture), so it could not push the ground and the ground did not push forward.`,
    miss_s_law: `${B('Friction is very small')}: the third law works everywhere, but if we cannot push there is no push back. The foot slid (look at the picture).`,
    miss_s_weak: `${B('Friction is very small')}: even when pushing hard the foot slides (look at the picture) and cannot push the ground. So there is no push back.`,

    q_who: 'At the moment in the picture, who pushes the student forward?',
    h_ground: 'The ground, pushing back',
    h_foot: 'The student’s own foot',
    h_self: 'The student, by themselves',
    h_air: 'The air behind',
    why_who: `${B('The ground')}: the foot pushes the ground backward, and the ground pushes the student forward. That push moves them.`,
    miss_h_foot: `${B('The ground')}, not the foot: the foot pushes the ground, not the student. The ground pushes the student forward.`,
    miss_h_self: `${B('The ground')}: nobody can move themselves forward with a force from inside. We walk because the ground pushes back.`,
    miss_h_air: `${B('The ground')}: the two pushes in the picture are the foot’s and the ground’s. The air does not push the student forward, the ground does.`,

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
