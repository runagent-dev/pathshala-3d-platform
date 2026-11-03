// Every string the figure shows, in Bangla (the book's NCTB terms, pages 191–193: তরঙ্গ, উপরিপাতন, বিস্তার, মাধ্যমের
// কণা, নিঃশেষ, ধনাত্মক/ঋণাত্মক) and English. Use t('key') in code, and t.num() for numbers (Bangla digits when the
// language is Bangla).

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'তরঙ্গের উপরিপাতন',
    view: 'দেখার ধরন',
    view_front_short: 'শুরুর দিক',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বিস্তার',

    ex_label: 'কোন তরঙ্গ',
    ex_one: '১ম তরঙ্গ',
    ex_two: '২য় তরঙ্গ',
    ex_both: 'দুটো একসাথে',
    act_one: 'শুধু ১ম উৎস চালাও',
    act_two: 'শুধু ২য় উৎস চালাও',
    act_both: 'দুটো উৎস চালাও',
    act_calm: 'পানি শান্ত করো',
    act_pause: 'থামাও',
    act_play: 'চালাও',
    act_reset: 'শুরু থেকে',

    lbl_src1: '১ম উৎস',
    lbl_src2: '২য় উৎস',
    lbl_a: 'ক',
    lbl_b: 'খ',

    g_row1: '১ম তরঙ্গ',
    g_row2: '২য় তরঙ্গ',
    g_sum: 'যোগফল',
    g_ball: 'বল {n}',
    graph_aria: 'দুটি বলের জায়গায় ১ম তরঙ্গ, ২য় তরঙ্গ আর দুটোর যোগফলের বিচ্যুতি, সময়ের সাথে',

    out_calm: 'পানি স্থির: বল ক আর খ ভেসে আছে।',
    out_spread: 'তরঙ্গ উৎস থেকে চারদিকে ছড়িয়ে পড়ছে…',
    out_amp: 'বিস্তার: ক-তে <b>{a}</b>, খ-তে <b>{b}</b>',
    out_dying: 'উৎস থেমেছে: শেষ তরঙ্গগুলো চলে যাচ্ছে।',
    amp_a: '{v}a',
    amp_zero: '{zero}',
    about: 'প্রায় ',

    rule_start: '<b>উপরিপাতন:</b> দুটি ভিন্ন জায়গা থেকে দুটি তরঙ্গ একটি বিন্দুতে এসে মিললে কী হয়? আগে একটি উৎস চালিয়ে দেখো।',
    rule_one: '<b>মাধ্যমের কণাগুলো নিজ অবস্থানে থেকে শুধু স্পন্দিত হয়</b>, তরঙ্গের সাথে সরে যায় না: তরঙ্গ এগোচ্ছে, বল দুটি একই জায়গায় ওঠানামা করছে।',
    rule_two: 'একা ২য় তরঙ্গও দুটো বলকেই দোলায়, ১ম তরঙ্গের মতোই। এবার দুটো উৎস একসাথে চালাও: খ-এর কী হয় দেখো।',
    rule_both:
      '<b>দুটি তরঙ্গ যোগ হয়ে আরো বড় তরঙ্গ হতে পারে, আবার একটি অন্যটিকে নিঃশেষও করে দিতে পারে।</b> ক-তে শীর্ষের (+) সাথে শীর্ষ মেলে: বিস্তার দ্বিগুণ। খ-তে শীর্ষের (+) সাথে খাদ (−): যোগফল শূন্য।',
    rule_calm: '<b>উপরিপাতন:</b> যেখানে দুটি তরঙ্গ মেলে, সেখানে বিচ্যুতি যোগ হয়। আবার চালিয়ে দেখো।',
    note: 'a = একটি তরঙ্গের বিস্তার · তরঙ্গদৈর্ঘ্য λ = {l} cm · কম্পাঙ্ক f = {f} Hz',
    scale_note: 'ঢেউ {h} গুণ উঁচু, {s} গুণ ধীর',
    hint_drag: 'টেনে ঘুরিয়ে দেখো',

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
    q_locked: 'পরীক্ষার সময় উৎসগুলো আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_meet: 'একটি বিন্দুতে ১ম তরঙ্গের শীর্ষ (+) আর ২য় তরঙ্গের খাদ (−) একই সময়ে এসে পৌঁছায়। সেখানে পানি কেমন থাকে?',
    c_meet_still: 'প্রায় স্থির থাকে',
    c_meet_double: 'দ্বিগুণ উঁচুতে ওঠানামা করে',
    c_meet_one: 'একটি তরঙ্গের মতোই ওঠানামা করে',
    c_meet_flow: 'পানি এক দিকে সরে যায়',
    why_meet: '<b>প্রায় স্থির থাকে:</b> বিচ্যুতি যোগ হয়: (+a) + (−a) = {zero}। একটি তরঙ্গ অন্যটিকে নিঃশেষ করে দেয়।',
    mis_meet_double: 'দ্বিগুণ হয় শীর্ষের সাথে শীর্ষ মিললে, এখানে চিহ্ন উল্টো।',
    mis_meet_one: 'দুটো তরঙ্গই আছে, তাদের যোগফল দেখতে হবে।',
    mis_meet_flow: 'তরঙ্গে পানি সরে যায় না, শুধু ওঠানামা করে।',

    q_which: 'দুটো উৎস চালু। বল দুটি নতুন জায়গায়। কোন বলটি সবচেয়ে বেশি ওঠানামা করছে?',
    c_which_a: 'বল ক',
    c_which_b: 'বল খ',
    c_which_same: 'দুটো সমান',
    c_which_none: 'কোনোটিই না',
    why_which: '<b>বল {w}:</b> সেখানে দুই তরঙ্গের শীর্ষ একসাথে আসে (প্রায় {two}a); বল {o}-তে শীর্ষের সাথে খাদ।',
    mis_which_same: 'দুটো বল একই তরঙ্গে আছে, কিন্তু জায়গাভেদে যোগফল আলাদা।',
    mis_which_none: 'একটি বল স্থির হলেও অন্যটি দ্বিগুণ বিস্তারে দোলে।',
    mis_which_wrong: 'ওই বলে ১ম আর ২য় তরঙ্গ উল্টো দিকে যায়: শীর্ষের সাথে খাদ।',

    q_one: 'এখন বল খ প্রায় স্থির। ২য় উৎসটি তুলে নিলে (শুধু ১ম তরঙ্গ থাকলে) বল খ কী করবে?',
    c_one_bob: 'আবার ওঠানামা করবে',
    c_one_still: 'স্থিরই থাকবে',
    c_one_double: '{two}a বিস্তারে দুলবে',
    c_one_drift: 'কিনারার দিকে ভেসে যাবে',
    why_one: '<b>আবার ওঠানামা করবে:</b> খ স্থির ছিল দুই তরঙ্গ একে অপরকে নিঃশেষ করছিল বলে; একা একটি তরঙ্গকে নিঃশেষ করার কেউ নেই।',
    mis_one_still: 'জায়গাটা নিজে স্থির নয়; দুটো তরঙ্গের যোগফল সেখানে শূন্য ছিল।',
    mis_one_double: '{two}a হয় দুটো তরঙ্গের শীর্ষ মিললে; এখানে তরঙ্গ একটিই।',
    mis_one_drift: 'তরঙ্গ পানিকে বয়ে নেয় না, কণা নিজ জায়গায় দোলে।',

    q_move: 'শুধু ১ম তরঙ্গ চলছে, বল ক-এর নিচ দিয়ে কিনারার দিকে এগোচ্ছে। বল ক নিজে কীভাবে চলে?',
    c_move_bob: 'একই জায়গায় শুধু ওঠানামা করে',
    c_move_drift: 'তরঙ্গের সাথে কিনারায় চলে যায়',
    c_move_back: 'উৎসের দিকে সরে আসে',
    c_move_circle: 'বড় বৃত্তে ঘুরতে থাকে',
    why_move: '<b>একই জায়গায় ওঠানামা করে:</b> মাধ্যমের কণাগুলো নিজ অবস্থানে থেকে শুধু স্পন্দিত হয়; এগিয়ে যায় শক্তি।',
    mis_move_drift: 'এগোয় তরঙ্গের আকার আর শক্তি, পানি বা বল নয়।',
    mis_move_back: 'বল কোনো দিকেই সরে না।',
    mis_move_circle: 'বলটি জায়গা ছেড়ে ঘোরে না; ছবিতে দেখো সে একই বিন্দুতে।',

    q_energy: 'বল ক-তে বিস্তার একটি তরঙ্গের দ্বিগুণ ({two}a)। সেখানে প্রবাহিত শক্তি একটি তরঙ্গের কত গুণ?',
    c_energy_4: '{n} গুণ',
    c_energy_2: '{n} গুণ',
    c_energy_1: 'সমান',
    c_energy_8: '{n} গুণ',
    why_energy: '<b>{four} গুণ:</b> প্রবাহিত শক্তি বিস্তারের বর্গের সমানুপাতিক: ({two}a)<sup>{two}</sup> = {four}a<sup>{two}</sup>।',
    mis_energy_2: 'বিস্তার {two} গুণ, কিন্তু শক্তি যায় বিস্তারের বর্গে।',
    mis_energy_1: 'বিস্তার বাড়লে শক্তিও বাড়ে।',
    mis_energy_8: '{two}-এর ঘন নয়, বর্গ: {two} × {two}।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Superposition of waves',
    view: 'View',
    view_front_short: 'Start view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Amplitude',

    ex_label: 'Which wave',
    ex_one: '1st wave',
    ex_two: '2nd wave',
    ex_both: 'Both together',
    act_one: 'Only the 1st source',
    act_two: 'Only the 2nd source',
    act_both: 'Run both sources',
    act_calm: 'Calm the water',
    act_pause: 'Pause',
    act_play: 'Play',
    act_reset: 'Start over',

    lbl_src1: 'Source 1',
    lbl_src2: 'Source 2',
    lbl_a: 'A',
    lbl_b: 'B',

    g_row1: '1st wave',
    g_row2: '2nd wave',
    g_sum: 'Sum',
    g_ball: 'Ball {n}',
    graph_aria: 'Displacement of the 1st wave, the 2nd wave and their sum at the two balls, against time',

    out_calm: 'The water is still: balls A and B float.',
    out_spread: 'The waves spread out from the source on all sides…',
    out_amp: 'Amplitude: at A <b>{a}</b>, at B <b>{b}</b>',
    out_dying: 'The sources stopped: the last waves move off.',
    amp_a: '{v}a',
    amp_zero: '{zero}',
    about: 'about ',

    rule_start: '<b>Superposition:</b> what happens when two waves from two different places meet at one point? First run one source.',
    rule_one:
      '<b>The particles of the medium only vibrate in their own place</b>, they do not move along with the wave: the wave moves on, the balls bob in the same spot.',
    rule_two: 'The 2nd wave alone also makes both balls bob, just like the 1st. Now run both together: watch what happens at B.',
    rule_both:
      '<b>Two waves can add up to a bigger wave, or one can cancel the other completely.</b> At A a crest (+) meets a crest: the amplitude doubles. At B a crest (+) meets a trough (−): the sum is zero.',
    rule_calm: '<b>Superposition:</b> where two waves meet, their displacements add. Run them again.',
    note: 'a = one wave’s amplitude · wavelength λ = {l} cm · frequency f = {f} Hz',
    scale_note: 'Waves {h}× taller, {s}× slower',
    hint_drag: 'Drag to turn the view',

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
    q_locked: 'The sources stay put during the test. Look at the picture and pick an answer.',

    q_meet: 'At one point a crest (+) of the 1st wave and a trough (−) of the 2nd arrive at the same time. What does the water there do?',
    c_meet_still: 'It stays almost still',
    c_meet_double: 'It bobs twice as high',
    c_meet_one: 'It bobs like one wave',
    c_meet_flow: 'The water flows one way',
    why_meet: '<b>It stays almost still:</b> the displacements add: (+a) + (−a) = {zero}. One wave cancels the other.',
    mis_meet_double: 'It doubles when a crest meets a crest; here the signs are opposite.',
    mis_meet_one: 'Both waves are there: you must add them.',
    mis_meet_flow: 'In a wave the water does not flow away, it only bobs.',

    q_which: 'Both sources are on, the balls in new places. Which ball bobs the most?',
    c_which_a: 'Ball A',
    c_which_b: 'Ball B',
    c_which_same: 'Both the same',
    c_which_none: 'Neither',
    why_which: '<b>Ball {w}:</b> there the two crests arrive together (about {two}a); at ball {o} a crest meets a trough.',
    mis_which_same: 'Both balls are in the same waves, but the sum differs from place to place.',
    mis_which_none: 'One ball is still, but the other bobs with twice the amplitude.',
    mis_which_wrong: 'At that ball the 1st and 2nd waves go opposite ways: crest on trough.',

    q_one: 'Ball B is almost still now. If the 2nd source is lifted (only the 1st wave left), what will ball B do?',
    c_one_bob: 'Bob again',
    c_one_still: 'Stay still',
    c_one_double: 'Bob with amplitude {two}a',
    c_one_drift: 'Drift to the rim',
    why_one: '<b>Bob again:</b> B was still because the two waves cancelled each other; one wave alone has nothing to cancel it.',
    mis_one_still: 'The place itself is not still; the two waves summed to zero there.',
    mis_one_double: '{two}a needs two crests to meet; here there is only one wave.',
    mis_one_drift: 'A wave does not carry the water along; particles bob in place.',

    q_move: 'Only the 1st wave runs, passing under ball A toward the rim. How does ball A itself move?',
    c_move_bob: 'Only up and down, in the same place',
    c_move_drift: 'Along with the wave to the rim',
    c_move_back: 'Back toward the source',
    c_move_circle: 'Round in a big circle',
    why_move: '<b>Up and down in the same place:</b> the particles of the medium only vibrate in place; the energy moves on.',
    mis_move_drift: 'The wave’s shape and energy move on, not the water or the ball.',
    mis_move_back: 'The ball moves in neither direction.',
    mis_move_circle: 'The ball does not leave its place; it stays on the same spot.',

    q_energy: 'At ball A the amplitude is twice one wave’s ({two}a). How many times one wave’s energy flows there?',
    c_energy_4: '{n} times',
    c_energy_2: '{n} times',
    c_energy_1: 'The same',
    c_energy_8: '{n} times',
    why_energy:
      '<b>{four} times:</b> energy carried is proportional to the square of the amplitude: ({two}a)<sup>{two}</sup> = {four}a<sup>{two}</sup>.',
    mis_energy_2: 'The amplitude is {two} times, but energy goes as its square.',
    mis_energy_1: 'More amplitude means more energy.',
    mis_energy_8: 'Not the cube of {two}, the square: {two} × {two}.',
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
