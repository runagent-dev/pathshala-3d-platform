// Every string the figure shows, in Bangla (in the book's words, pages 84–86, ৩.৮: নিউটনের তৃতীয় গতি সূত্র, বল প্রয়োগ,
// ক্রিয়া ও প্রতিক্রিয়া, সমান ও বিপরীত, ভিন্ন ভিন্ন বস্তু, আকর্ষণ, পৃথিবীর ভর M, ত্বরণ) and English.
// The words on screen are everyday ones first (who pushes whom, equally hard, in opposite directions); the book's law,
// word for word, is the LAST step, and the symbols (a = F/m, M) come only at the end, once the student has seen what
// they stand for. Use t('key', vars) in code, and t.num() for numbers (Bangla digits when the language is Bangla).
// Units are the book's Latin symbols (kg, ms⁻²) with a no-break space; the force in Bangla is "নিউটন" (N in English).

const NB = ' ';
const ACC = 'ms<sup>−2</sup>';

export const STRINGS = {
  bn: {
    title: 'নিউটনের তৃতীয় গতি সূত্র',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',
    pairs: 'কে কাকে ধাক্কা দিচ্ছে বা টানছে',

    // the three pairs (the row of words) and what each showed (small, under the word)
    chip_equal: 'সমান ভর',
    chip_unequal: 'হালকা–ভারী',
    chip_apple: 'আপেল–পৃথিবী',
    res_equal: 'সমান সরে',
    res_unequal: 'হালকা বেশি',
    res_apple: 'পৃথিবী নড়ে না',

    // the action (the big button and the numbered ring on the view)
    act_equal: 'ধাক্কা দাও',
    act_unequal: 'ধাক্কা দাও',
    act_apple: 'আপেল ছেড়ে দাও',
    act_on_equal: 'সমান ভরে ধাক্কা দাও',
    act_on_unequal: 'হালকা ও ভারীকে ধাক্কা দাও',
    act_on_apple: 'আপেল ছেড়ে দাও',
    act_again: 'আবার ধাক্কা দাও',
    act_again_apple: 'আবার ছেড়ে দাও',

    // the result line: one number at most, in <b>, kept with its unit by a no-break space
    out_rest: 'দুজনেই স্থির: এখনো কেউ ধাক্কা দেয়নি',
    out_push: `A ধাক্কা দিচ্ছে B-কে, B-ও ধাক্কা দিচ্ছে A-কে: সমান জোরে, <b>{f}${NB}নিউটন</b> করে`,
    out_push_f: `ডান দিক ধনাত্মক ধরে বইয়ে বল দুটির নাম F আর −F: B-এর ওপর F = <b>{f}${NB}নিউটন</b>, A-এর ওপর −F`,
    out_same: 'দুজনই <b>সমান</b> সরে গেল: দুজনের ভর সমান',
    out_more: 'হালকা A সরে গেল ভারী B-র চেয়ে <b>{k} গুণ</b> বেশি',
    out_apple_rest: 'আপেলটি হাতে ধরা',
    out_apple_fall: `পৃথিবী টানছে আপেলকে, আপেলও টানছে পৃথিবীকে: সমান জোরে, <b>{f}${NB}নিউটন</b> করে`,
    out_apple_fall_f: `বইয়ে এই বলের নাম F: আপেল আর পৃথিবী দুজনের ওপরই F = <b>{f}${NB}নিউটন</b>`,
    out_apple_after: 'আপেল নিচে নামল, কিন্তু পৃথিবী <b>নড়ল না</b> বললেই চলে',

    // the rule line: one short sentence per idea, plain words, growing with what the student has found out;
    // the book's law, word for word, is the last step
    rule_start_skaters: '<b>একজন আরেকজনকে ধাক্কা দিলে</b> কী হবে? ধাক্কা দিয়ে দেখো।',
    rule_start_apple: '<b>পৃথিবী আপেলকে টানে।</b> আপেলও কি পৃথিবীকে টানে? ছেড়ে দিয়ে দেখো।',
    rule_equal: '<b>A ধাক্কা দেয় B-কে, B-ও ধাক্কা দেয় A-কে, সমান জোরে।</b> বল দুটি আলাদা দুজনের ওপর, তাই কাটাকাটি হয় না।',
    rule_unequal: '<b>বল সমান, তবু হালকা জন বেশি সরে।</b> ভারী জনকে সরানো কঠিন।',
    rule_apple: '<b>আপেলও পৃথিবীকে টানে, সমান জোরে।</b> পৃথিবী এত ভারী যে সে নড়ে না বললেই চলে।',
    rule_law: '<b>নিউটনের তৃতীয় সূত্র:</b> যখন একটি বস্তু অন্য একটি বস্তুর ওপর বল প্রয়োগ করে তখন সেই বস্তুটিও প্রথম বস্তুটির ওপর বিপরীত দিকে সমান বল প্রয়োগ করে।',

    // labels in the picture
    l_A: `A · {m}${NB}kg`,
    l_B: `B · {m}${NB}kg`,
    l_apple: `আপেল · {m}${NB}kg`,
    l_earth_name: 'পৃথিবী',
    l_earth_big: 'অতি ভারী',
    l_earth_acc: 'পৃথিবীর ত্বরণ',
    l_on_A: 'A-এর ওপর বল',
    l_on_B: 'B-এর ওপর বল',
    l_on_apple: 'আপেলের ওপর বল',
    l_on_earth: 'পৃথিবীর ওপর বল',
    l_F: `<b>{f}${NB}নিউটন</b>`,
    l_F_sym: `F = <b>{f}${NB}নিউটন</b>`,
    l_F_neg: `−F = <b>−{f}${NB}নিউটন</b>`,

    // the honest notes on the view
    badge_skaters: 'মসৃণ মেঝে: ঘর্ষণ ধরা হয়নি',
    badge_apple: 'আকার প্রকৃত অনুপাতে নয় · সময় {k} গুণ ধীর',

    hint_wait: 'দেখো কী হয়: তারপর আবার ধাক্কা দিতে পারবে।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'দৃশ্যটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_look: 'দেখো…',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। দেখে উত্তর বেছে নাও।',

    // 1. what does the apple do to the Earth (the apple falling, one arrow shown)
    q_react: 'ছবিতে পৃথিবী আপেলকে নিচের দিকে টানছে (তীর)। তখন আপেল কী করছে?',
    r_ok: 'আপেলও পৃথিবীকে ওপরের দিকে টানছে',
    r_same: 'আপেল পৃথিবীকে নিচের দিকে টানছে',
    r_none: 'আপেল পৃথিবীকে টানছে না, শুধু পড়ছে',
    r_ground: 'মাটি আপেলকে ওপরে ধাক্কা দিচ্ছে',
    why_react: '<b>আপেলও পৃথিবীকে ওপরে টানছে</b>, সমান জোরে। একটি বল আপেলের ওপর, অন্যটি পৃথিবীর ওপর: এটিই প্রতিক্রিয়া।',
    not_r_same: 'টান উল্টো দিকে: আপেল পৃথিবীকে ওপরে টানে।',
    not_r_none: 'ছোট হলেও আপেল পৃথিবীকে টানে, সমান জোরে।',
    not_r_ground: 'আপেল এখনো মাটি ছোঁয়নি। জোড়ার বলটি পৃথিবীর ওপর।',

    // 2. do the two forces cancel (two skaters, both arrows shown)
    q_cancel: 'A আর B সমান জোরে উল্টো দিকে ধাক্কা দিচ্ছে। তবু দুজনেই সরে যাচ্ছে: জোর দুটি কাটাকাটি হচ্ছে না কেন?',
    c_ok: 'জোর দুটি আলাদা দুজনের ওপর',
    c_small: 'একজনের জোর একটু কম',
    c_fric: 'ঘর্ষণ জোর দুটি আলাদা রাখে',
    c_time: 'একজনের জোর আগে আসে, অন্যজনের পরে',
    why_cancel: '<b>জোর দুটি আলাদা দুজনের ওপর:</b> একটি A-র ওপর, অন্যটি B-র ওপর। একজনের ওপর হলে তবেই কাটাকাটি হতো।',
    not_c_small: 'জোর দুটি ঠিক সমান। কারণ অন্য।',
    not_c_fric: 'মসৃণ মেঝেতেও একই হয়।',
    not_c_time: 'দুটি জোর একই সময়ে কাজ করে।',

    // 3. who moves more (the masses are on the picture)
    q_who: 'A আর B একে অপরকে ধাক্কা দিল (ভর ছবিতে লেখা)। কে বেশি সরবে?',
    who_A: 'A বেশি সরবে',
    who_B: 'B বেশি সরবে',
    who_same: 'দুজন সমান সরবে',
    who_unknown: 'ধাক্কার জোর না জানলে বলা যায় না',
    why_who: `<b>{x} বেশি সরবে</b> ({light}${NB}kg আর {heavy}${NB}kg): জোর সমান, তাই হালকা জন বেশি সরে (a = F/m)।`,
    not_who_heavy: 'ভারী জনকে সরানো কঠিন: একই জোরে সে কম সরে।',
    not_who_same: 'জোর সমান, কিন্তু ভর আলাদা: ফলও আলাদা।',
    not_who_unknown: 'জোর দুজনেরই সমান; ভর ছবিতেই লেখা।',

    // 4. the pair is equal in size, whatever the masses
    q_size: 'ছবির ভারী জন আর হালকা জন একে অপরকে ধাক্কা দিচ্ছে। কার ওপর জোর বেশি?',
    s_heavy: 'ভারী জনের ওপর বেশি',
    s_light: 'হালকা জনের ওপর বেশি',
    s_equal: 'দুজনের ওপর সমান',
    s_pusher: 'যে আগে ধাক্কা দিয়েছে, তার জোর বেশি',
    why_size: `<b>দুজনের ওপর সমান</b> ({f}${NB}নিউটন করে): ভর যাই হোক, বল দুটি সমান ও উল্টো দিকে।`,
    not_s_heavy: 'ভর বেশি বলে জোর বেশি হয় না।',
    not_s_light: 'হালকা জন বেশি সরে, কিন্তু জোর সমান।',
    not_s_pusher: 'আগে-পরে নেই: দুটি জোর একসঙ্গে, সমান।',

    // 5. why the Earth does not visibly move
    q_earth: 'আপেল পৃথিবীকে যত জোরে টানে, পৃথিবীও আপেলকে তত জোরেই টানে। তবু পৃথিবীকে নড়তে দেখি না কেন?',
    e_ok: 'পৃথিবী এত ভারী, তাই প্রায় নড়ে না',
    e_less: 'আপেল পৃথিবীকে অনেক কম জোরে টানে',
    e_cancel: 'আপেল আর পৃথিবীর টান কাটাকাটি হয়ে যায়',
    e_none: 'ছোট জিনিস বড় জিনিসকে টানে না',
    why_earth: `<b>পৃথিবী এত ভারী</b> (M = {M}${NB}kg) যে একই জোরে তার ত্বরণ প্রায় {ae}${NB}${ACC}: অতি ক্ষুদ্র।`,
    not_e_less: 'বল দুটি সমান।',
    not_e_cancel: 'জোর দুটি আলাদা বস্তুর ওপর, কাটাকাটি হয় না।',
    not_e_none: 'ভর আছে এমন যেকোনো দুটি জিনিস পরস্পরকে টানে।',
  },

  en: {
    title: "Newton's third law of motion",
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Turn it',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',
    pairs: 'Who pushes or pulls whom',

    chip_equal: 'Equal masses',
    chip_unequal: 'Light–heavy',
    chip_apple: 'Apple–Earth',
    res_equal: 'same motion',
    res_unequal: 'light moves more',
    res_apple: 'Earth stays',

    act_equal: 'Push',
    act_unequal: 'Push',
    act_apple: 'Let the apple go',
    act_on_equal: 'Push with equal masses',
    act_on_unequal: 'Push the light and the heavy',
    act_on_apple: 'Let the apple go',
    act_again: 'Push again',
    act_again_apple: 'Let go again',

    out_rest: 'Both at rest: nobody has pushed yet',
    out_push: `A pushes B and B pushes A: equally hard, <b>{f}${NB}N</b> each`,
    out_push_f: `With right positive, the book calls the two forces F and −F: on B, F = <b>{f}${NB}N</b>; on A, −F`,
    out_same: 'Both moved <b>the same</b>: they have the same mass',
    out_more: 'The light A moved <b>{k} times</b> as far as the heavy B',
    out_apple_rest: 'The apple is held in the hand',
    out_apple_fall: `The Earth pulls the apple and the apple pulls the Earth: equally hard, <b>{f}${NB}N</b> each`,
    out_apple_fall_f: `In the book this force is called F: on the apple and on the Earth, F = <b>{f}${NB}N</b>`,
    out_apple_after: 'The apple came down, but the Earth <b>hardly moved</b>',

    rule_start_skaters: '<b>When one pushes the other,</b> what happens? Push and see.',
    rule_start_apple: '<b>The Earth pulls the apple.</b> Does the apple pull the Earth too? Let go and see.',
    rule_equal: '<b>A pushes B and B pushes A, equally hard.</b> The two forces act on two different people, so they do not cancel.',
    rule_unequal: '<b>The forces are equal, yet the light one moves more.</b> The heavy one is harder to move.',
    rule_apple: '<b>The apple pulls the Earth too, equally hard.</b> The Earth is so heavy that it hardly moves.',
    rule_law:
      "<b>Newton's third law:</b> when one body exerts a force on another body, the second body also exerts an equal force on the first, in the opposite direction.",

    l_A: `A · {m}${NB}kg`,
    l_B: `B · {m}${NB}kg`,
    l_apple: `Apple · {m}${NB}kg`,
    l_earth_name: 'Earth',
    l_earth_big: 'very heavy',
    l_earth_acc: "Earth's acceleration",
    l_on_A: 'Force on A',
    l_on_B: 'Force on B',
    l_on_apple: 'Force on the apple',
    l_on_earth: 'Force on the Earth',
    l_F: `<b>{f}${NB}N</b>`,
    l_F_sym: `F = <b>{f}${NB}N</b>`,
    l_F_neg: `−F = <b>−{f}${NB}N</b>`,

    badge_skaters: 'Smooth floor: friction ignored',
    badge_apple: 'Not to scale · time {k} times slower',

    hint_wait: 'Watch what happens: then you can push again.',

    q_count: 'Question {i} / {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the scene, think, then choose the right answer.',
    q_look: 'Look…',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The right answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} correct',
    q_great: 'Great! All correct.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look and choose.',

    q_react: 'In the picture the Earth pulls the apple down (the arrow). What is the apple doing then?',
    r_ok: 'The apple pulls the Earth up too',
    r_same: 'The apple pulls the Earth down',
    r_none: 'The apple does not pull the Earth, it only falls',
    r_ground: 'The ground pushes the apple up',
    why_react: '<b>The apple pulls the Earth up too</b>, equally hard. One force acts on the apple, the other on the Earth: this is the reaction.',
    not_r_same: 'The pull is the other way: the apple pulls the Earth up.',
    not_r_none: 'Small as it is, the apple pulls the Earth, equally hard.',
    not_r_ground: 'The apple has not touched the ground. The pair acts on the Earth.',

    q_cancel: 'A and B push each other equally hard in opposite directions. Yet both move: why do the two forces not cancel?',
    c_ok: 'They act on two different people',
    c_small: 'One of them pushes a little less',
    c_fric: 'Friction from the floor keeps them apart',
    c_time: 'One force comes first, the other later',
    why_cancel: '<b>The forces act on two different people:</b> one on A, the other on B. Only forces on one body could cancel.',
    not_c_small: 'The two forces are exactly equal. The reason is another.',
    not_c_fric: 'It is the same on a smooth floor.',
    not_c_time: 'The two forces act at the same time.',

    q_who: 'A and B pushed each other (masses are on the picture). Who moves more?',
    who_A: 'A moves more',
    who_B: 'B moves more',
    who_same: 'Both move the same',
    who_unknown: 'Cannot say without the force',
    why_who: `<b>{x} moves more</b> ({light}${NB}kg and {heavy}${NB}kg): the force is equal, so the lighter one moves more (a = F/m).`,
    not_who_heavy: 'The heavy one is harder to move: the same force moves it less.',
    not_who_same: 'The force is equal, but the masses differ: so does the result.',
    not_who_unknown: 'The force is the same on both; the masses are on the picture.',

    q_size: 'The heavy skater and the light skater in the picture push each other. On whom is the force bigger?',
    s_heavy: 'Bigger on the heavy one',
    s_light: 'Bigger on the light one',
    s_equal: 'Equal on both',
    s_pusher: 'Whoever pushed first pushes harder',
    why_size: `<b>Equal on both</b> ({f}${NB}N each): whatever the masses, the two forces are equal and opposite.`,
    not_s_heavy: 'More mass does not make the force bigger.',
    not_s_light: 'The light one moves more, but the force is equal.',
    not_s_pusher: 'There is no first and second: both forces act together and are equal.',

    q_earth: 'The apple pulls the Earth as hard as the Earth pulls the apple. Yet we never see the Earth move. Why?',
    e_ok: 'The Earth is so heavy it hardly moves',
    e_less: 'The apple pulls the Earth much less hard',
    e_cancel: 'The two pulls cancel each other',
    e_none: 'A small thing does not pull a big one',
    why_earth: `<b>The Earth is so heavy</b> (M = {M}${NB}kg), so the same force gives it an acceleration of only about {ae}${NB}${ACC}.`,
    not_e_less: 'The two forces are equal.',
    not_e_cancel: 'They act on two different bodies, so they do not cancel.',
    not_e_none: 'Any two things with mass pull each other.',
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
