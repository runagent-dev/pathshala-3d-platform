// Every string the figure shows, in Bangla (as the book, pages 64–65, topic 3.1.1: জড়তা, স্থিতি জড়তা, গতি জড়তা,
// স্থির থাকতে চায়, গতিশীল থাকতে চায়, পেছনের দিকে হেলে পড়া, হুমড়ি খেয়ে পড়া, শরীরের নিচের অংশ, শরীরের ওপরের
// অংশ) and English. Use t('key') in code, and t.num() for numbers (Bangla digits in Bangla).
// The test's worked answers: w_<question>; the line that names a wrong choice's mistake: m_<question>_<choice>.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    view: 'দেখার ধরন',
    view_front_short: 'পাশ থেকে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    q_again: 'আবার পরীক্ষা দাও',

    idea: '<b>জড়তা:</b> বল প্রয়োগ না করা পর্যন্ত স্থির বস্তু স্থির থাকতে চায়, গতিশীল বস্তু গতিশীল থাকতে চায়।',
    speed_k_coin: 'টেবিল বরাবর দ্রুতি',
    unit_speed: 'মি/সে',
    part_card: 'কার্ড',
    part_coin: 'কয়েন',
    act_play: 'চালাও',
    act_pause: 'থামাও',
    act_replay: 'আবার দেখো',
    slow_badge: 'সময় {k} গুণ ধীর',

    set_coin: 'গ্লাসের ওপর একটি কার্ড, কার্ডের ওপর একটি কয়েন।',
    do_coin: 'কার্ডটি ছুঁয়ে দাও: আঙুল কার্ডে জোরে টোকা দেবে। লক্ষ করো, কয়েনটি কোথায় যায়।',
    watch: 'দেখো, কী হয়…',
    why_coin: '<b>স্থিতি জড়তা।</b> টোকা দিলে কার্ড হঠাৎ সরে যায়, কিন্তু স্থির কয়েনটি স্থির থাকতে চায়, কার্ডের সাথে যায় না। নিচে কার্ড না থাকায় কয়েন সোজা গ্লাসে পড়ে।',
    tag_coin_lower: 'হঠাৎ সরে যায়',
    tag_coin_upper: 'স্থির থাকতে চায়',
    tag_coin_upper_drop: 'সোজা নিচে পড়ে',
    coach_card: 'কার্ডটি ছুঁয়ে দাও',

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
    q_locked: 'পরীক্ষার সময় চালানো যায় না। দেখে উত্তর বেছে নাও।',

    q_coin: 'কার্ডটিতে আঙুল দিয়ে জোরে টোকা দিলে কয়েনটির কী হবে?',
    o_coin_glass: 'গ্লাসের ভেতরে পড়বে',
    o_coin_with: 'কার্ডের সাথে উড়ে যাবে',
    o_coin_back: 'উল্টো দিকে ছিটকে পড়বে',
    o_coin_float: 'শূন্যে যেখানে ছিল সেখানেই থাকবে',
    w_coin: '<b>গ্লাসের ভেতরে পড়বে</b>: কার্ড সরে যায়, স্থির কয়েন স্থির থাকতে চায় (স্থিতি জড়তা)।',
    m_coin_o_coin_with: 'এত অল্প সময়ে ঘর্ষণ কয়েনকে টানতে পারে না।',
    m_coin_o_coin_back: 'কয়েনকে উল্টো দিকে কেউ ঠেলে না।',
    m_coin_o_coin_float: 'নিচে কিছু না থাকলে অভিকর্ষ তাকে নামায়।',

    q_coin_kind: 'কার্ড সরে গেল, কয়েনটি কার্ডের সাথে না গিয়ে গ্লাসে পড়ল। এটি কোন জড়তা, কেন?',
    o_ck_rest: 'স্থিতি জড়তা: স্থির কয়েন স্থির থাকতে চায়',
    o_ck_motion: 'গতি জড়তা: কয়েন গতিশীল থাকতে চায়',
    o_ck_card: 'স্থিতি জড়তা: কার্ড স্থির থাকতে চায়',
    o_ck_push: 'জড়তা নয়: আঙুল কয়েনকে নিচে ঠেলে',
    w_coin_kind: '<b>স্থিতি জড়তা</b>: কয়েনটি স্থির ছিল, কার্ড হঠাৎ সরে গেলেও সে স্থির থাকতে চায়; তাই কার্ডের সাথে যায় না, সোজা গ্লাসে পড়ে।',
    m_coin_kind_o_ck_motion: 'কয়েনটি আগে চলছিল না, স্থির ছিল।',
    m_coin_kind_o_ck_card: 'কার্ড তো স্থির থাকেনি, ছিটকে চলে গেছে; স্থির থেকেছে কয়েন।',
    m_coin_kind_o_ck_push: 'আঙুল কার্ডে লাগে, কয়েনে নয়।',
    q_coin_speed: 'আঙুল কার্ডে জোরে টোকা দিলে ঠিক পরের মুহূর্তে কোনটি দ্রুত চলবে?',
    o_cs_card: 'কার্ড; কয়েন প্রায় স্থির থাকে',
    o_cs_coin: 'কয়েন; কার্ড প্রায় স্থির থাকে',
    o_cs_same: 'দুটোই একই দ্রুতিতে চলে',
    o_cs_none: 'কোনোটাই চলে না',
    w_coin_speed: 'টোকা লাগে <b>কার্ডে</b>, তাই কার্ড হঠাৎ জোরে ছোটে। কয়েন স্থির থাকতে চায়। এত অল্প সময়ে ঘর্ষণ তাকে প্রায় কিছুই দিতে পারে না (তীর দুটি দেখো)।',
    m_coin_speed_o_cs_coin: 'আঙুল কয়েনে লাগে না, কার্ডে লাগে।',
    m_coin_speed_o_cs_same: 'কয়েন কার্ডের সাথে যায় না: সে স্থির থাকতে চায়।',
    m_coin_speed_o_cs_none: 'টোকা লাগলে কার্ড চলবেই।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    view: 'View',
    view_front_short: 'Side',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    q_again: 'Take the test again',

    idea: '<b>Inertia:</b> until a force acts, a body at rest wants to stay at rest, and a moving body wants to keep moving.',
    speed_k_coin: 'Speed along the table',
    unit_speed: 'm/s',
    part_card: 'Card',
    part_coin: 'Coin',
    act_play: 'Play',
    act_pause: 'Pause',
    act_replay: 'Again',
    slow_badge: 'Time {k}× slower',

    set_coin: 'A card on a glass, a coin on the card.',
    do_coin: 'Tap the card: a finger will flick it hard. Watch where the coin goes.',
    watch: 'Watch what happens…',
    why_coin:
      '<b>Inertia of rest.</b> The flick moves the card away suddenly, but the coin at rest wants to stay at rest and does not go with it. With the card gone, it falls straight into the glass.',
    tag_coin_lower: 'moves away suddenly',
    tag_coin_upper: 'wants to stay at rest',
    tag_coin_upper_drop: 'falls straight down',
    coach_card: 'Tap the card',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and choose the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_locked: 'It cannot be played during the test. Look and pick an answer.',

    q_coin: 'If you flick the card hard with a finger, what happens to the coin?',
    o_coin_glass: 'It falls into the glass',
    o_coin_with: 'It flies off with the card',
    o_coin_back: 'It shoots off the other way',
    o_coin_float: 'It stays in the air where it was',
    w_coin: '<b>It falls into the glass</b>: the card moves away, the coin at rest wants to stay at rest (inertia of rest).',
    m_coin_o_coin_with: 'In so short a time friction cannot pull the coin along.',
    m_coin_o_coin_back: 'Nothing pushes the coin the other way.',
    m_coin_o_coin_float: 'With nothing under it, gravity brings it down.',

    q_coin_kind: 'The card flew off and the coin fell into the glass instead of going with it. Which inertia is this, and why?',
    o_ck_rest: 'Inertia of rest: the coin at rest wants to stay at rest',
    o_ck_motion: 'Inertia of motion: the coin wants to keep moving',
    o_ck_card: 'Inertia of rest: the card wants to stay at rest',
    o_ck_push: 'Not inertia: the finger pushes the coin down',
    w_coin_kind:
      '<b>Inertia of rest</b>: the coin was at rest and wants to stay at rest when the card moves away suddenly, so it does not go with the card and falls straight into the glass.',
    m_coin_kind_o_ck_motion: 'The coin was not moving before; it was at rest.',
    m_coin_kind_o_ck_card: 'The card did not stay; it flew off. The coin stayed.',
    m_coin_kind_o_ck_push: 'The finger hits the card, not the coin.',
    q_coin_speed: 'Just after the finger flicks the card hard, which one moves fast?',
    o_cs_card: 'The card; the coin hardly moves',
    o_cs_coin: 'The coin; the card hardly moves',
    o_cs_same: 'Both move at the same speed',
    o_cs_none: 'Neither moves',
    w_coin_speed:
      'The flick hits <b>the card</b>, so it shoots off. The coin wants to stay at rest. In so short a time, friction gives it almost nothing (look at the two arrows).',
    m_coin_speed_o_cs_coin: 'The finger hits the card, not the coin.',
    m_coin_speed_o_cs_same: 'The coin does not go with the card: it wants to stay at rest.',
    m_coin_speed_o_cs_none: 'A flick does move the card.',
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
  t.has = (key) => key in dict;
  return t;
}
