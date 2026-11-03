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

    // the graph
    g_words: 'গ্রাফে দেখাও',
    g_x: 'সরণ x',
    g_v: 'বেগ v',
    g_acc: 'ত্বরণ',
    g_time: 'সময় (s)',
    g_K: 'K',
    g_U: 'U',
    g_aria: 'সময়ের সাথে {q} এর গ্রাফ; পাশে গতিশক্তি K আর স্থিতি শক্তি U এর দুটি দণ্ড',
    g_legend: '<b class="c-K">K</b> গতিশক্তি · <b class="c-U">U</b> স্থিতি শক্তি · <b class="c-T">T</b> দোলনকাল, এক পূর্ণ স্পন্দন',

    // the action
    act_release: 'টেনে ছেড়ে দাও',
    act_less: 'কম টেনে ছেড়ে দাও',
    act_more: 'বেশি টেনে ছেড়ে দাও',
    act_mass: 'ভর বদলে ছেড়ে দাও',
    act_again: 'আবার টেনে ছেড়ে দাও',
    act_let: 'ছেড়ে দাও',
    act_stop: 'থামাও',

    // the result line
    out_rest: 'ভরটি সাম্যাবস্থায় স্থির; স্প্রিং <b>{x0} cm</b> লম্বা হয়েছে।',
    out_held: 'সাম্যাবস্থা থেকে <b>{a} cm</b> {dir} সরানো। এবার ছেড়ে দাও।',
    dir_down: 'নিচে',
    dir_up: 'উপরে',
    out_run: 'দোলনকাল T = <b class="c-T">{T} s</b> · কম্পাঙ্ক f = <b class="c-f">{f} Hz</b>',

    // the rule, growing with what the student has found
    rule_start: '<b>সরল স্পন্দন গতি:</b> টেনে ছেড়ে দিলে ভরটি সাম্যাবস্থার উপরে-নিচে a দূরত্ব পর্যন্ত দোলে। প্রত্যয়নী বল F = −kx।',
    rule_energy:
      '<b>T = 2π√(m/k), f = {#1}/T।</b> প্রান্তে v = {#0}, সবটুকু <b class="c-U">U</b>; সাম্যাবস্থায় বেগ সবচেয়ে বেশি, সবটুকু <b class="c-K">K</b>। এবার অন্য দূরত্বে টানো।',
    rule_amp: '<b>বিস্তার a বদলালেও T একই ({T} s):</b> সূত্রে a নেই। এবার ভর m বা k বদলাও।',
    rule_mk_only: '<b>T = 2π√(m/k):</b> ভর বাড়লে T বাড়ে, k বাড়লে T কমে। এবার অন্য দূরত্বে টেনে দেখো।',
    rule_all: '<b>T = 2π√(m/k):</b> ভর {#4} গুণ হলে T দ্বিগুণ; a তে T বদলায় না। প্রতি T পর একই দশা ফিরে আসে।',

    // labels on the picture
    lbl_eq: 'সাম্যাবস্থা',
    lbl_v0: 'v = {#0}',
    lbl_amp: 'বিস্তার a',
    lbl_a: 'a = {a} cm',
    lbl_v: 'বেগ v',
    note_slow: 'সময় {n} গুণ ধীর',

    hint_locked: 'পরীক্ষার সময় ভর আর স্প্রিং বদলানো যায় না। উত্তর বেছে নাও।',

    // the test
    g_total: 'K+U',
    q_graph_title: 'সরণ x – সময় গ্রাফ',
    q_slope: 'গ্রাফের কোন বিন্দুতে ভরটির বেগ সবচেয়ে বেশি?',
    c_sl_A: 'বিন্দু A',
    c_sl_B: 'বিন্দু B',
    c_sl_C: 'বিন্দু C',
    c_sl_D: 'বিন্দু D',
    why_slope: '<b>বিন্দু C:</b> x–t গ্রাফের ঢালই বেগ; গ্রাফ সবচেয়ে খাড়া সাম্যাবস্থায় (x = {#0})।',
    mis_sl_A: 'A তে ভরটি সবচেয়ে উপরে, গ্রাফ সমতল: v = {#0}।',
    mis_sl_B: 'B তে বেগ তখনো বাড়ছে; গ্রাফ সবচেয়ে খাড়া C তে।',
    mis_sl_D: 'D তে ভরটি সবচেয়ে নিচে, গ্রাফ সমতল: v = {#0}।',
    q_freq: 'গ্রাফ থেকে দোলনকাল T পড়ো। ভরটির কম্পাঙ্ক f কত?',
    c_f_right: 'প্রায় {f1} Hz',
    c_f_T: 'প্রায় {f0} Hz',
    c_f_half: 'প্রায় {f2} Hz',
    c_f_2T: 'প্রায় {f3} Hz',
    why_freq: '<b>প্রায় {f} Hz:</b> নিচ থেকে আবার নিচে, একটি পূর্ণ স্পন্দনে প্রায় {T} s লাগে; f = {#1}/T।',
    mis_f_T: 'এটা T এর মান; কম্পাঙ্ক f = {#1}/T।',
    mis_f_half: 'নিচ থেকে উপর অর্ধেক স্পন্দন, পুরো T নয়।',
    mis_f_2T: 'এখানে দুটি স্পন্দনের সময় ধরা হয়েছে।',
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

    q_energy: 'এই মুহূর্তে ভরটির শক্তি কোন রূপে আছে?',
    c_en_U: 'সবটুকু স্থিতি শক্তি U',
    c_en_K: 'সবটুকু গতিশক্তি K',
    c_en_half: 'অর্ধেক K, অর্ধেক U',
    c_en_none: 'কোনো শক্তিই নেই',
    why_energy: '<b>সবটুকু স্থিতি শক্তি U:</b> প্রান্তে v = {#0}, তাই K = {#0}। সাম্যাবস্থার দিকে যেতে U কমে, K বাড়ে।',
    mis_en_K: 'গতিশক্তি সবচেয়ে বেশি সাম্যাবস্থায়, প্রান্তে নয়।',
    mis_en_half: 'অর্ধেক-অর্ধেক হয় প্রান্ত আর সাম্যাবস্থার মাঝে।',
    mis_en_none: 'শক্তি হারায়নি: K + U সবসময় একই।',

    q_phase: 'ভরটি এখন সাম্যাবস্থা পার হয়ে উপরে যাচ্ছে। প্রথম কখন আবার ঠিক এই দশা হবে?',
    c_ph_T: 'T পরে, উপরে যেতে যেতে',
    c_ph_half: 'T/{#2} পরে, নিচে যেতে যেতে',
    c_ph_quarter: 'T/{#4} পরে, সবচেয়ে উপরে',
    c_ph_2T: '{#2}T পরে, উপরে যেতে যেতে',
    why_phase: '<b>T পরে:</b> একই জায়গা, একই দিকে গতি, তাই একই দশা: একটি পূর্ণ স্পন্দন (বইয়ের চিত্রে {#2} থেকে {#6})।',
    mis_ph_half: 'T/{#2} পরে অবস্থান একই, কিন্তু দিক উল্টো ({#2} থেকে {#4})।',
    mis_ph_quarter: 'সেখানে অবস্থানও আলাদা, বেগও শূন্য।',
    mis_ph_2T: '{#2}T পরেও একই দশা, কিন্তু প্রথমবার আসে T পরেই।',

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

    g_words: 'Show on the graph',
    g_x: 'displacement x',
    g_v: 'velocity v',
    g_acc: 'acceleration',
    g_time: 'time (s)',
    g_K: 'K',
    g_U: 'U',
    g_aria: 'Graph of {q} against time, with two bars for the kinetic energy K and the potential energy U',
    g_legend: '<b class="c-K">K</b> kinetic · <b class="c-U">U</b> potential · <b class="c-T">T</b> period, one full oscillation',

    act_release: 'Pull it down and let go',
    act_less: 'Pull less and let go',
    act_more: 'Pull more and let go',
    act_mass: 'Change the mass, let go',
    act_again: 'Pull and let go again',
    act_let: 'Let go',
    act_stop: 'Stop',

    out_rest: 'The mass hangs still at equilibrium; the spring is <b>{x0} cm</b> longer.',
    out_held: 'Moved <b>{a} cm</b> {dir} from equilibrium. Now let go.',
    dir_down: 'down',
    dir_up: 'up',
    out_run: 'Period T = <b class="c-T">{T} s</b> · frequency f = <b class="c-f">{f} Hz</b>',

    rule_start: '<b>Simple harmonic motion:</b> let go, the mass swings a above and below equilibrium. Restoring force F = −kx.',
    rule_energy:
      '<b>T = 2π√(m/k), f = 1/T.</b> At the ends v = 0, all <b class="c-U">U</b>; at equilibrium fastest, all <b class="c-K">K</b>. Now pull another distance.',
    rule_amp: '<b>Another amplitude a, the same T ({T} s):</b> there is no a in the rule. Now change m or k.',
    rule_mk_only: '<b>T = 2π√(m/k):</b> more mass, longer T; larger k, shorter T. Now pull another distance.',
    rule_all: '<b>T = 2π√(m/k):</b> four times the mass, twice T; a does not change T. The same phase returns every T.',

    lbl_eq: 'equilibrium',
    lbl_v0: 'v = {#0}',
    lbl_amp: 'amplitude a',
    lbl_a: 'a = {a} cm',
    lbl_v: 'velocity v',
    note_slow: 'time {n}× slower',

    hint_locked: 'The mass and the spring stay as they are during the test. Pick an answer.',

    g_total: 'K+U',
    q_graph_title: 'displacement x – time graph',
    q_slope: 'At which point of the graph is the mass fastest?',
    c_sl_A: 'point A',
    c_sl_B: 'point B',
    c_sl_C: 'point C',
    c_sl_D: 'point D',
    why_slope: '<b>Point C:</b> the slope of the x–t graph is the velocity; it is steepest at equilibrium (x = 0).',
    mis_sl_A: 'At A the mass is at the top and the graph is flat: v = 0.',
    mis_sl_B: 'At B it is still speeding up; the graph is steepest at C.',
    mis_sl_D: 'At D the mass is at the bottom and the graph is flat: v = 0.',
    q_freq: 'Read the period T off the graph. What is the frequency f?',
    c_f_right: 'about {f1} Hz',
    c_f_T: 'about {f0} Hz',
    c_f_half: 'about {f2} Hz',
    c_f_2T: 'about {f3} Hz',
    why_freq: '<b>About {f} Hz:</b> from the bottom back to the bottom, one full oscillation, takes about {T} s; f = 1/T.',
    mis_f_T: 'That is the value of T; the frequency is f = 1/T.',
    mis_f_half: 'Bottom to top is half an oscillation, not the whole T.',
    mis_f_2T: 'That takes the time of two oscillations.',
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

    q_energy: 'In what form is the mass’s energy at this instant?',
    c_en_U: 'All potential energy U',
    c_en_K: 'All kinetic energy K',
    c_en_half: 'Half K, half U',
    c_en_none: 'No energy at all',
    why_energy: '<b>All potential energy U:</b> at an end v = 0, so K = 0. On the way to equilibrium U falls and K grows.',
    mis_en_K: 'The kinetic energy is largest at equilibrium, not at an end.',
    mis_en_half: 'Half and half is between an end and equilibrium.',
    mis_en_none: 'No energy is lost: K + U stays the same.',

    q_phase: 'The mass is passing equilibrium going up. When is it first in exactly this phase again?',
    c_ph_T: 'after T, going up',
    c_ph_half: 'after T/2, going down',
    c_ph_quarter: 'after T/4, at the top',
    c_ph_2T: 'after 2T, going up',
    why_phase: '<b>After T:</b> the same place, moving the same way, so the same phase: one full oscillation (the book’s 2 to 6).',
    mis_ph_half: 'After T/2 the place is the same but it moves the other way (2 to 4).',
    mis_ph_quarter: 'There the place is different and v = 0.',
    mis_ph_2T: 'After 2T it is the same phase too, but it first comes back after T.',

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
