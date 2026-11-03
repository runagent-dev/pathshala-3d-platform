// Every string the figure shows, in Bangla (NCTB terms, as on book pages 188–190) and English. Use t('key') in code,
// and t.num() for numbers (Bangla digits when the language is Bangla). Units are the book's Latin symbols.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'স্প্রিংয়ে ঝোলানো ভর: সরল স্পন্দন গতি',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দৃশ্য',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'পাঠ',

    // the two rows of words
    row_m: 'ভর m',
    row_k: 'স্প্রিং ধ্রুবক k',
    sym_m: 'm',
    sym_k: 'k',
    w_kg: '{m} kg',
    w_nm: '{k} N/m',

    // the graph
    g_words: 'গ্রাফে দেখাও',
    g_x: 'সরণ x',
    g_v: 'বেগ v',
    g_acc: 'ত্বরণ',
    g_time: 'সময় (s)',
    g_K: 'K',
    g_U: 'U',
    g_aria: 'সময়ের সাথে {q} এর গ্রাফ; পাশে গতিশক্তি K আর স্থিতি শক্তি U এর দুটি দণ্ড',
    g_legend: '<b class="c-K">K</b> গতিশক্তি · <b class="c-U">U</b> স্থিতি শক্তি · <b class="c-T">T</b> দোলনকাল',

    // the action
    act_release: 'টেনে ছেড়ে দাও',
    act_less: 'কম টেনে ছেড়ে দাও',
    act_more: 'বেশি টেনে ছেড়ে দাও',
    act_mass: 'ভর বদলে ছেড়ে দাও',
    act_again: 'আবার টেনে ছেড়ে দাও',
    act_let: 'ছেড়ে দাও',
    act_stop: 'থামাও',

    // the result line
    out_rest: 'ভরটি সাম্যাবস্থায় স্থির; ভরের টানে স্প্রিং <b>{x0} cm</b> লম্বা হয়েছে।',
    out_held: 'সাম্যাবস্থা থেকে <b>{a} cm</b> {dir} সরানো। এবার ছেড়ে দাও।',
    dir_down: 'নিচে',
    dir_up: 'উপরে',
    out_run: 'দোলনকাল T = <b class="c-T">{T} s</b>, কম্পাঙ্ক f = {#1}/T = <b class="c-f">{f} Hz</b>',

    // the rule, growing with what the student has found
    rule_start:
      '<b>সরল স্পন্দন গতি:</b> ভরটিকে a দূরত্ব টেনে নামিয়ে ছেড়ে দিলে সেটা সাম্যাবস্থা পার হয়ে উপরে a দূরত্বে ওঠে, তারপর আবার নামে। প্রত্যয়নী বল F = −kx সবসময় তাকে সাম্যাবস্থার দিকে টানে।',
    rule_energy:
      '<b>T = 2π√(m/k)</b>। দুই প্রান্তে বেগ v = {#0}, সবটুকু শক্তি স্থিতি শক্তি <b class="c-U">U</b>; সাম্যাবস্থায় বেগ সবচেয়ে বেশি, সবটুকু গতিশক্তি <b class="c-K">K</b>। এবার অন্য দূরত্বে টেনে দেখো।',
    rule_amp: '<b>বিস্তার a বদলালেও দোলনকাল T একই ({T} s):</b> T = 2π√(m/k) সূত্রে a নেই। এবার ভর m বা k বদলে দেখো।',
    rule_mk_only: '<b>T = 2π√(m/k):</b> ভর বেশি হলে T বাড়ে, k বেশি (শক্ত স্প্রিং) হলে T কমে। এবার অন্য দূরত্বে টেনে দেখো: a বদলালে কি T বদলায়?',
    rule_all: '<b>T = 2π√(m/k):</b> ভর {#4} গুণ হলে T দ্বিগুণ; k বেশি হলে T কমে; বিস্তার a তে T বদলায় না। এক দোলনকাল পর আবার সেই দশা ফিরে আসে।',

    // labels on the picture
    lbl_eq: 'সাম্যাবস্থা',
    lbl_top: '+a · v = {#0}',
    lbl_bot: '−a · v = {#0}',
    lbl_top_q: '+a',
    lbl_bot_q: '−a',
    lbl_a: 'a = {a} cm',
    lbl_v: 'বেগ v',
    note_slow: 'সময় {n} গুণ ধীর',

    hint_locked: 'পরীক্ষার সময় ভর আর স্প্রিং বদলানো যায় না। উত্তর বেছে নাও।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ভরটি টানা যায় না। ছবি দেখে উত্তর বেছে নাও।',

    q_vmax: 'ভরটি দুলছে (বেগের তীর লুকানো)। কোথায় এর বেগ সবচেয়ে বেশি?',
    c_vmax_eq: 'সাম্যাবস্থা পার হওয়ার সময়',
    c_vmax_ends: 'দুই প্রান্তে, +a আর −a তে',
    c_vmax_bot: 'শুধু সবচেয়ে নিচে, −a তে',
    c_vmax_half: 'প্রান্ত আর সাম্যাবস্থার ঠিক মাঝে',
    why_vmax: '<b>সাম্যাবস্থায়:</b> সেখানে সবটুকু শক্তি গতিশক্তি K। দুই প্রান্তে ভরটি এক মুহূর্ত থেমে দিক বদলায় (v = {#0})।',
    mis_vmax_ends: 'প্রান্তে বল সবচেয়ে বেশি, কিন্তু বেগ শূন্য।',
    mis_vmax_bot: 'নিচের প্রান্তেও ভরটি এক মুহূর্ত থামে।',
    mis_vmax_half: 'মাঝপথে বেগ তখনো বাড়ছে বা কমছে।',

    q_energy: 'ভরটি এখন সবচেয়ে নিচে, −a তে। এই মুহূর্তে এর শক্তি কোন রূপে আছে?',
    c_en_U: 'সবটুকু স্থিতি শক্তি U',
    c_en_K: 'সবটুকু গতিশক্তি K',
    c_en_half: 'অর্ধেক K, অর্ধেক U',
    c_en_none: 'কোনো শক্তিই নেই',
    why_energy: '<b>সবটুকু স্থিতি শক্তি U:</b> প্রান্তে v = {#0}, তাই K = {#0}। সাম্যাবস্থার দিকে যেতে U কমে, K বাড়ে।',
    mis_en_K: 'গতিশক্তি সবচেয়ে বেশি সাম্যাবস্থায়, প্রান্তে নয়।',
    mis_en_half: 'অর্ধেক-অর্ধেক হয় প্রান্ত আর সাম্যাবস্থার মাঝে।',
    mis_en_none: 'শক্তি হারায়নি: K + U সবসময় একই।',

    q_phase: 'ভরটি এখন সাম্যাবস্থা পার হয়ে উপরে যাচ্ছে। আবার ঠিক এই দশা ফিরে আসবে কখন?',
    c_ph_T: 'T পরে, আবার এখানে উপরে ওঠার সময়',
    c_ph_half: 'T/{#2} পরে, এখানে নিচে নামার সময়',
    c_ph_quarter: 'T/{#4} পরে, সবচেয়ে উপরে (+a) পৌঁছে',
    c_ph_2T: '{#2}T পরে, দ্বিতীয়বার এখানে ফিরে',
    why_phase: '<b>T পরে:</b> একই অবস্থান, একই দিকে গতি, তাই একই দশা: একটি পূর্ণ স্পন্দন (বইয়ের চিত্রে {#2} থেকে {#6})।',
    mis_ph_half: 'T/{#2} পরে অবস্থান একই, কিন্তু দিক উল্টো ({#2} থেকে {#4})।',
    mis_ph_quarter: 'সেখানে অবস্থানও আলাদা, বেগও শূন্য।',
    mis_ph_2T: 'একই দশা প্রথমবার আসে T পরেই।',

    q_mass: 'এই স্প্রিংয়ে এক টুকরো ভর ({m1} kg) দুলছে। চার টুকরো ({m2} kg) ঝোলালে দোলনকাল T কত গুণ হবে?',
    c_m_2: 'দ্বিগুণ',
    c_m_4: '{#4} গুণ',
    c_m_half: 'অর্ধেক',
    c_m_same: 'একই থাকবে',
    why_mass: '<b>দ্বিগুণ:</b> T = 2π√(m/k); m চার গুণ হলে √{#4} = {#2}, তাই T দুই গুণ ({T1} s থেকে {T2} s)।',
    mis_m_4: 'T বাড়ে ভরের বর্গমূলের সাথে, ভরের সাথে সরাসরি নয়।',
    mis_m_half: 'ভারী ভর ধীরে দোলে; T বাড়ে, কমে না।',
    mis_m_same: 'দোলকের T ভরের উপর নির্ভর করে না, স্প্রিংয়ের T করে।',

    q_amp: 'একই ভর আর স্প্রিং। এখন {a1} cm টেনে ছাড়া হয়েছে। {a2} cm (দ্বিগুণ) টেনে ছাড়লে দোলনকাল T কী হবে?',
    c_a_same: 'একই থাকবে',
    c_a_2: 'দ্বিগুণ হবে',
    c_a_half: 'অর্ধেক হবে',
    c_a_sqrt: '√{#2} গুণ হবে',
    why_amp: '<b>একই থাকবে ({T} s):</b> T = 2π√(m/k) সূত্রে a নেই। বেশি টানলে বেশি দূর যায়, কিন্তু বেগও বেশি হয়।',
    mis_a_2: 'বেশি দূর যেতে হয় ঠিকই, কিন্তু বেগও তত গুণ বেশি হয়।',
    mis_a_half: 'বেশি টানলে বল বেশি, কিন্তু যেতেও হয় বেশি দূর।',
    mis_a_sqrt: 'বর্গমূল আছে m/k এর উপর, a এর উপর নয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'A mass on a spring: simple harmonic motion',
    view: 'View',
    view_front_short: 'Starting view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Reading',

    row_m: 'Mass m',
    row_k: 'Spring constant k',
    sym_m: 'm',
    sym_k: 'k',
    w_kg: '{m} kg',
    w_nm: '{k} N/m',

    g_words: 'Show on the graph',
    g_x: 'displacement x',
    g_v: 'velocity v',
    g_acc: 'acceleration',
    g_time: 'time (s)',
    g_K: 'K',
    g_U: 'U',
    g_aria: 'Graph of {q} against time, with two bars for the kinetic energy K and the potential energy U',
    g_legend: '<b class="c-K">K</b> kinetic · <b class="c-U">U</b> potential · <b class="c-T">T</b> period',

    act_release: 'Pull it down and let go',
    act_less: 'Pull less and let go',
    act_more: 'Pull more and let go',
    act_mass: 'Change the mass, let go',
    act_again: 'Pull and let go again',
    act_let: 'Let go',
    act_stop: 'Stop',

    out_rest: 'The mass hangs still at equilibrium; its weight has stretched the spring by <b>{x0} cm</b>.',
    out_held: 'Moved <b>{a} cm</b> {dir} from equilibrium. Now let go.',
    dir_down: 'down',
    dir_up: 'up',
    out_run: 'Period T = <b class="c-T">{T} s</b>, frequency f = 1/T = <b class="c-f">{f} Hz</b>',

    rule_start:
      '<b>Simple harmonic motion:</b> pulled down by a and let go, the mass rises past equilibrium to a above it, then comes down again. The restoring force F = −kx always pulls it back toward equilibrium.',
    rule_energy:
      '<b>T = 2π√(m/k)</b>. At both ends v = 0 and all the energy is potential energy <b class="c-U">U</b>; at equilibrium it is fastest and all the energy is kinetic <b class="c-K">K</b>. Now pull it a different distance.',
    rule_amp: '<b>A different amplitude a, the same period T ({T} s):</b> there is no a in T = 2π√(m/k). Now change the mass m or k.',
    rule_mk_only:
      '<b>T = 2π√(m/k):</b> more mass, longer T; a larger k (a stiffer spring), shorter T. Now pull a different distance: does a change T?',
    rule_all:
      '<b>T = 2π√(m/k):</b> four times the mass doubles T; a larger k shortens it; the amplitude a does not change it. After one period the same phase comes back.',

    lbl_eq: 'equilibrium',
    lbl_top: '+a · v = {#0}',
    lbl_bot: '−a · v = {#0}',
    lbl_top_q: '+a',
    lbl_bot_q: '−a',
    lbl_a: 'a = {a} cm',
    lbl_v: 'velocity v',
    note_slow: 'time {n}× slower',

    hint_locked: 'The mass and the spring stay as they are during the test. Pick an answer.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, then pick an answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The mass stays put during the test. Look at the picture and pick an answer.',

    q_vmax: 'The mass is oscillating (the velocity arrow is hidden). Where is it fastest?',
    c_vmax_eq: 'As it passes equilibrium',
    c_vmax_ends: 'At both ends, +a and −a',
    c_vmax_bot: 'Only at the bottom, at −a',
    c_vmax_half: 'Half way between an end and equilibrium',
    why_vmax: '<b>At equilibrium:</b> there all the energy is kinetic K. At the two ends the mass stops for an instant and turns (v = 0).',
    mis_vmax_ends: 'The force is largest at the ends, but v is zero there.',
    mis_vmax_bot: 'At the bottom end it stops for an instant too.',
    mis_vmax_half: 'Half way it is still speeding up or slowing down.',

    q_energy: 'The mass is now at the bottom, at −a. In what form is its energy at this instant?',
    c_en_U: 'All potential energy U',
    c_en_K: 'All kinetic energy K',
    c_en_half: 'Half K, half U',
    c_en_none: 'No energy at all',
    why_energy: '<b>All potential energy U:</b> at an end v = 0, so K = 0. On the way to equilibrium U falls and K grows.',
    mis_en_K: 'The kinetic energy is largest at equilibrium, not at an end.',
    mis_en_half: 'Half and half is between an end and equilibrium.',
    mis_en_none: 'No energy is lost: K + U stays the same.',

    q_phase: 'The mass is now passing equilibrium going up. When will exactly this phase come back?',
    c_ph_T: 'After T, here again going up',
    c_ph_half: 'After T/2, here going down',
    c_ph_quarter: 'After T/4, at the top (+a)',
    c_ph_2T: 'After 2T, here for the second time',
    why_phase: '<b>After T:</b> the same place, moving the same way, so the same phase: one full oscillation (the book’s 2 to 6).',
    mis_ph_half: 'After T/2 the place is the same but it moves the other way (2 to 4).',
    mis_ph_quarter: 'There the place is different and v = 0.',
    mis_ph_2T: 'The same phase first comes back after T already.',

    q_mass: 'One piece of mass ({m1} kg) is oscillating on this spring. With four pieces ({m2} kg), how many times the period T?',
    c_m_2: 'Twice',
    c_m_4: '4 times',
    c_m_half: 'Half',
    c_m_same: 'The same',
    why_mass: '<b>Twice:</b> T = 2π√(m/k); four times m gives √4 = 2, so T doubles ({T1} s থেকে {T2} s).',
    mis_m_4: 'T grows with the square root of the mass, not with the mass itself.',
    mis_m_half: 'A heavier mass oscillates more slowly; T grows, it does not shrink.',
    mis_m_same: 'A pendulum’s T does not depend on the mass; a spring’s does.',

    q_amp: 'The same mass and spring, now let go from {a1} cm. Let go from {a2} cm (twice as far), what happens to T?',
    c_a_same: 'It stays the same',
    c_a_2: 'It doubles',
    c_a_half: 'It halves',
    c_a_sqrt: 'It grows √2 times',
    why_amp: '<b>The same ({T} s):</b> there is no a in T = 2π√(m/k). Pulled further, it goes further but faster too.',
    mis_a_2: 'It has further to go, but it goes that many times faster too.',
    mis_a_half: 'A bigger pull means a bigger force, but also further to go.',
    mis_a_sqrt: 'The square root is over m/k, not over a.',
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
    s = s.replace(/\{#([^}]+)\}/g, (_, d) => num(d)); // a digit written in a string: Bangla or Latin as the figure's digits
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
