// Every string the figure shows, in Bangla (plain words first: ঝুলন্ত ওজন, ব্লক, সুতার টান, ত্বরণ; the symbols M, m, Mg, T,
// a only once the student has met every effect, in the law line: the book's words on pages 81–82, topic 3.7, are
// নিউটনের দ্বিতীয় সূত্র, ওজন, টান বল, ত্বরণ, কপিকল, সুতা, টেবিল, ধনাত্মক, ঋণাত্মক) and English.
// Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come in as {vars}. A {key} that is not
// a var is another string of the same language: units are {u_N} (Bangla "নিউটন"), {u_n} (the short "N" on the
// picture), {u_kg}, {u_v} (m/s) and {u_a} (ms⁻², written with <sup>: the bundled font has no ⁻ ² ₁ ₂), always after a
// no-break space.

export const STRINGS = {
  bn: {
    title: 'ঝুলন্ত ভর ও টেবিলের বস্তু',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'ত্বরণ',
    u_N: 'নিউটন',
    u_n: 'N',
    u_kg: 'kg',
    u_v: 'm/s',
    u_a: 'ms<sup>−2</sup>',

    // the row of words: the four experiments
    experiments: 'ঝুলন্ত ওজন ও ব্লক বেছে নাও',
    chip_w2: 'ঝুলন্ত ২ kg',
    chip_w5: 'ঝুলন্ত ৫ kg',
    chip_heavy: 'ব্লক ১০ kg',
    chip_two: 'দুই দিকে',
    res_a: 'ত্বরণ {a}',

    // the action: the big button and the numbered ring on the block
    act_release: 'ছেড়ে দাও',
    act_next_w2: '২ kg ঝুলিয়ে ছেড়ে দাও',
    act_next_w5: '৫ kg ঝুলিয়ে ছেড়ে দাও',
    act_next_heavy: 'ভারী ব্লকে ছেড়ে দাও',
    act_next_two: 'দুই দিকে ঝুলিয়ে ছেড়ে দাও',
    act_again: 'আবার ছেড়ে দাও',
    act_home: 'শুরুতে ফেরাও',

    // the result: what they see, one number in <b>
    out_ready: 'ঝুলন্ত ওজন <b>{M} kg</b> · ব্লক <b>{m} kg</b>',
    out_ready_two: 'বাম <b>{m2} kg</b> · ডান <b>{m1} kg</b> · ব্লক <b>{m} kg</b>',
    out_run: 'গতি প্রতি সেকেন্ডে <b>{a} {u_v}</b> করে বাড়ছে',

    // the rule: one short sentence per idea, growing with what the student has found; the law last
    rule_ready: '<b>ঝুলন্ত ওজন সুতা দিয়ে ব্লককে টানবে।</b> ছেড়ে দিলে কী হবে?',
    rule_first: '<b>সুতার টান দুই মাথায় সমান,</b> কিন্তু ঝুলন্ত ওজনের চেয়ে কম। তাই ওজন নামে, ব্লক ছোটে।',
    rule_more_M: '<b>ঝুলন্ত ওজন যত বেশি, ব্লক তত তাড়াতাড়ি ছোটে।</b>',
    rule_more_m: '<b>ব্লক যত ভারী, তত ধীরে ছোটে।</b> ২ গুণ ভারী হলে ত্বরণ অর্ধেক হয় না।',
    rule_law:
      '<b>নিউটনের দ্বিতীয় সূত্র:</b> <span class="c-a">a</span> = <span class="c-W">Mg</span> ÷ (M + <span class="c-m">m</span>), অর্থাৎ ত্বরণ = ঝুলন্ত ওজন ÷ দুই ভর একসাথে।',
    rule_two_ready: '<b>দুই মাথায় দুটি ওজন।</b> ভারী ওজন ব্লককে কোন দিকে টানবে?',
    rule_two_left: '<b>বাম দিকের ওজন ভারী,</b> তাই ব্লক বাম দিকে ছোটে। দুই সুতার টান আলাদা।',
    rule_two_right: '<b>ডান দিকের ওজন ভারী,</b> তাই ব্লক ডান দিকে ছোটে। দুই সুতার টান আলাদা।',

    // labels on the picture: the words first; the symbols only once the law line has been shown
    lbl_hang: 'ঝুলন্ত {M} kg',
    lbl_hang_sym: 'M = {M} kg',
    lbl_block: 'ব্লক {m} kg',
    lbl_block_sym: 'm = {m} kg',
    lbl_left: 'বাম {m} kg',
    lbl_right: 'ডান {m} kg',
    nm_W: 'ওজন',
    nm_W_sym: 'Mg',
    nm_T: 'টান',
    nm_T_sym: 'T',
    nm_a: 'ত্বরণ',
    nm_a_sym: 'a',
    nm_Wl: 'বাম ওজন',
    nm_Wr: 'ডান ওজন',
    nm_Tl: 'বাম টান',
    nm_Tr: 'ডান টান',
    lbl_plain: '{name} {val}',
    lbl_sym: '{name} = {val}',
    val_N: '{v} {u_n}',
    val_a: '{v} {u_a}',

    // the notes on the stage
    note_head: 'মসৃণ টেবিল:',
    note_body: 'ঘর্ষণ নেই ধরা হয়েছে · সময় {k} গুণ ধীর',
    note_body_short: 'ঘর্ষণ নেই · সময় {k} গুণ ধীর',
    note_scale: 'বল ও ত্বরণের তীর আলাদা মাপে',

    hint_wait: 'ছেড়ে দেওয়া হয়েছে: দেখো কী হয়।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    // 1: the acceleration, from the two weights on the picture
    q_calc: 'ছবিতে ঝুলন্ত ওজন আর ব্লকের kg দেখো। ছেড়ে দিলে ত্বরণ কত হবে? (g = {g} ধরো, ঘর্ষণ নেই)',
    why_calc: '<b>{a} {u_a}।</b> হিসাব: ঝুলন্ত ওজন ÷ দুই ভর = {M} × {g} ÷ ({M} + {m})।',
    mis_swap: 'টানছে ঝুলন্ত ওজন, ব্লকের ওজন নয়।',
    mis_block: 'ঝুলন্ত ভরও চলছে: দুই ভরকেই টানতে হয়।',
    mis_g: 'ব্লকও চলছে, তাই g-র চেয়ে কম।',

    // 2: a weight made 2 times
    q_M: 'ঝুলন্ত ওজন {M} kg, ব্লক {m} kg। ঝুলন্ত ওজন ২ গুণ ({M2} kg) করলে ত্বরণ কেমন হবে?',
    c_M_more: '২ গুণের চেয়ে কম বাড়বে',
    c_M_double: 'ঠিক ২ গুণ হবে',
    c_M_same: 'একই থাকবে',
    c_M_less: 'কমবে',
    why_M: '<b>{a1} থেকে {a2}: বাড়ল, কিন্তু ২ গুণ নয়।</b> চলা ভরও বাড়ল।',
    not_M_double: 'ওজন ২ গুণ, কিন্তু চলা ভরও বাড়ে।',
    not_M_same: 'বেশি ওজন বেশি টানে: ত্বরণ বাড়ে।',
    not_M_less: 'বেশি ওজন বেশি টানে, ত্বরণ কমে না।',
    q_m: 'ঝুলন্ত ওজন {M} kg, ব্লক {m} kg। ব্লক ২ গুণ ({m2} kg) ভারী করলে ত্বরণ কেমন হবে?',
    c_m_less: 'কমবে, কিন্তু অর্ধেক নয়',
    c_m_half: 'ঠিক অর্ধেক হবে',
    c_m_same: 'একই থাকবে',
    c_m_more: 'বাড়বে',
    why_m: '<b>{a1} থেকে {a2}: কমল, কিন্তু অর্ধেক নয়।</b> ঝুলন্ত ভর তো একই।',
    not_m_half: 'চলা ভর ২ গুণ হয়নি: ঝুলন্ত ভর একই।',
    not_m_same: 'ভারী ব্লক বেশি ধীরে ছোটে।',
    not_m_more: 'ভারী ব্লক ধীরে ছোটে, ত্বরণ বাড়ে না।',

    // 3: the string's pull against the weight, from the arrows
    q_tension: 'ব্লক আর ঝুলন্ত ওজন ছুটছে। তীর দেখে বলো: সুতার টান বড়, না ঝুলন্ত ওজন?',
    c_T_less: 'ওজন বড়, তাই ভরটি নিচে নামছে',
    c_T_equal: 'দুটি সমান',
    c_T_more: 'সুতার টান বড়',
    c_T_zero: 'সুতায় টান নেই, ভর পড়ছে',
    why_tension: '<b>ওজন বড়:</b> ওজন {W} {u_N}, টান {T} {u_N}। তাই ভর নামছে।',
    not_T_equal: 'সমান হলে ভর নামত না।',
    not_T_more: 'টান বড় হলে ভর উঠত।',
    not_T_zero: 'টান না থাকলে ব্লক চলত না।',

    // 4: one string, one pull
    q_same: 'ব্লকের দিকে সুতার টান ছবিতে লেখা আছে। ঝুলন্ত ওজনের দিকে সুতার টান কত?',
    c_same_same: '{T} {u_N}, একই',
    c_same_weight: '{W} {u_N}, ওজনের সমান',
    c_same_zero: '০ {u_N}',
    c_same_sum: '{T2} {u_N}, দুই দিকের যোগ',
    why_same: '<b>{T} {u_N}, একই:</b> একটি সুতায় একটিই টান।',
    not_same_weight: 'টান ওজনের চেয়ে কম।',
    not_same_zero: 'টান না থাকলে ব্লক চলত না।',
    not_same_sum: 'টান যোগ হয় না: একটিই টান।',

    // 5: the page-82 example: a weight at each end
    q_two: 'দুই দিকে ওজন ঝুলছে (ডান দিক ধনাত্মক)। ব্লক কোন দিকে যায়, ত্বরণ কত? (g = {g} ধরো)',
    why_two: '<b>{side}, {a} {u_a}:</b> ভারী ওজনের দিকে। ({big} − {small}) × {g} ÷ ({big} + {small} + {m})।',
    side_left: 'বাম দিকে (−)',
    side_right: 'ডান দিকে (+)',
    not_two_side: 'ভারী ওজনই ব্লককে টানে।',
    not_two_nomass: 'ব্লকও চলছে: তার ভরও ধরতে হয়।',
    not_two_one: 'হালকা ওজনও উল্টো দিকে টানে।',
  },
  en: {
    title: 'Hanging weight pulls a block',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Acceleration',
    u_N: 'N',
    u_n: 'N',
    u_kg: 'kg',
    u_v: 'm/s',
    u_a: 'ms<sup>−2</sup>',

    experiments: 'Choose what hangs and what rests on the table',
    chip_w2: 'Hang 2 kg',
    chip_w5: 'Hang 5 kg',
    chip_heavy: 'Block 10 kg',
    chip_two: 'Both sides',
    res_a: 'acc. {a}',

    act_release: 'Let go',
    act_next_w2: 'Hang 2 kg and let go',
    act_next_w5: 'Hang 5 kg and let go',
    act_next_heavy: 'Heavier block, let go',
    act_next_two: 'Hang both sides, let go',
    act_again: 'Let go again',
    act_home: 'Back to the start',

    out_ready: 'Hanging weight <b>{M} kg</b> · block <b>{m} kg</b>',
    out_ready_two: 'Left <b>{m2} kg</b> · right <b>{m1} kg</b> · block <b>{m} kg</b>',
    out_run: 'The speed grows by <b>{a} {u_v}</b> every second',

    rule_ready: '<b>The hanging weight pulls the block by the string.</b> What will happen when it is let go?',
    rule_first: '<b>The string pulls equally at both ends,</b> but less than the weight. So the weight goes down and the block moves.',
    rule_more_M: '<b>The heavier the hanging weight, the faster the block speeds up.</b>',
    rule_more_m: '<b>The heavier the block, the slower it speeds up.</b> Twice as heavy does not halve the acceleration.',
    rule_law:
      '<b>Newton\'s second law:</b> <span class="c-a">a</span> = <span class="c-W">Mg</span> ÷ (M + <span class="c-m">m</span>), that is acceleration = hanging weight ÷ both masses together.',
    rule_two_ready: '<b>A weight at each end.</b> Which way will the heavier one pull the block?',
    rule_two_left: '<b>The left weight is heavier,</b> so the block goes left. The two strings pull differently.',
    rule_two_right: '<b>The right weight is heavier,</b> so the block goes right. The two strings pull differently.',

    lbl_hang: 'Hanging {M} kg',
    lbl_hang_sym: 'M = {M} kg',
    lbl_block: 'Block {m} kg',
    lbl_block_sym: 'm = {m} kg',
    lbl_left: 'Left {m} kg',
    lbl_right: 'Right {m} kg',
    nm_W: 'Weight',
    nm_W_sym: 'Mg',
    nm_T: 'Pull',
    nm_T_sym: 'T',
    nm_a: 'Accel.',
    nm_a_sym: 'a',
    nm_Wl: 'Left weight',
    nm_Wr: 'Right weight',
    nm_Tl: 'Left pull',
    nm_Tr: 'Right pull',
    lbl_plain: '{name} {val}',
    lbl_sym: '{name} = {val}',
    val_N: '{v} {u_n}',
    val_a: '{v} {u_a}',

    note_head: 'Smooth table:',
    note_body: 'no friction assumed · time {k}× slower',
    note_body_short: 'no friction · time {k}× slower',
    note_scale: 'force and acceleration arrows use different scales',

    hint_wait: 'It has been let go: watch what happens.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_look: 'Look…',
    q_right: 'Correct!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The scene stays put during the test. Look at the picture and pick an answer.',

    q_calc: 'Read the hanging weight and the block in kg on the picture. What is the acceleration once it is let go? (take g = {g}, no friction)',
    why_calc: '<b>{a} {u_a}.</b> Working: hanging weight ÷ both masses = {M} × {g} ÷ ({M} + {m}).',
    mis_swap: "What pulls is the hanging weight, not the block's weight.",
    mis_block: 'The hanging mass moves too: both masses are pulled.',
    mis_g: 'The block moves too, so less than g.',

    q_M: 'Hanging weight {M} kg, block {m} kg. If the hanging weight is made 2 times ({M2} kg), what happens to the acceleration?',
    c_M_more: 'Grows, but less than 2 times',
    c_M_double: 'Exactly 2 times',
    c_M_same: 'Stays the same',
    c_M_less: 'Shrinks',
    why_M: '<b>{a1} to {a2}: it grows, but not 2 times.</b> The mass that moves grew too.',
    not_M_double: 'The weight is 2 times, but the moving mass grows too.',
    not_M_same: 'A bigger weight pulls more: it grows.',
    not_M_less: 'A bigger weight pulls more, so it does not shrink.',
    q_m: 'Hanging weight {M} kg, block {m} kg. If the block is made 2 times as heavy ({m2} kg), what happens to the acceleration?',
    c_m_less: 'Shrinks, but not to half',
    c_m_half: 'Exactly half',
    c_m_same: 'Stays the same',
    c_m_more: 'Grows',
    why_m: '<b>{a1} to {a2}: it shrinks, but not to half.</b> The hanging mass is the same.',
    not_m_half: 'The moving mass did not double: the hanging mass is the same.',
    not_m_same: 'A heavier block is slower.',
    not_m_more: 'A heavier block is slower, so it does not grow.',

    q_tension: "The block and the hanging weight are moving. From the arrows: which is bigger, the string's pull or the hanging weight?",
    c_T_less: 'The weight, so it goes down',
    c_T_equal: 'They are equal',
    c_T_more: "The string's pull",
    c_T_zero: 'No pull in the string, the mass is falling',
    why_tension: '<b>The weight is bigger:</b> weight {W} {u_N}, pull {T} {u_N}. So it goes down.',
    not_T_equal: 'If they were equal it would not go down.',
    not_T_more: 'If the pull were bigger it would go up.',
    not_T_zero: 'Without a pull the block would not move.',

    q_same: 'The pull of the string on the block is written on the picture. How big is the pull on the hanging weight?',
    c_same_same: '{T} {u_N}, the same',
    c_same_weight: '{W} {u_N}, equal to the weight',
    c_same_zero: '0 {u_N}',
    c_same_sum: '{T2} {u_N}, both sides added',
    why_same: '<b>{T} {u_N}, the same:</b> one string, one pull.',
    not_same_weight: 'The pull is less than the weight.',
    not_same_zero: 'Without a pull the block would not move.',
    not_same_sum: 'Pulls are not added: there is one pull.',

    q_two: 'Weights hang at both ends (right is positive). Which way does the block go, and what is the acceleration? (take g = {g})',
    why_two: '<b>{side}, {a} {u_a}:</b> towards the heavier weight. ({big} − {small}) × {g} ÷ ({big} + {small} + {m}).',
    side_left: 'to the left (−)',
    side_right: 'to the right (+)',
    not_two_side: 'The heavier weight pulls the block.',
    not_two_nomass: 'The block moves too: its mass counts.',
    not_two_one: 'The lighter weight pulls back too.',
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
    const fill = (s) =>
      s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : typeof dict[k] === 'string' && !dict[k].includes('{') ? dict[k] : m));
    return fill(dict[key] ?? key);
  }
  t.num = num;
  t.lang = code;
  return t;
}
