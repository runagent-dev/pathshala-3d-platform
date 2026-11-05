// Every string the figure shows, in Bangla (the book's words, page 67: বল, স্থির বস্তু চলতে শুরু করে, গতিশীল বস্তুর
// বেগের পরিবর্তন, স্পর্শ বল, অস্পর্শ বল, স্পর্শ করতে হয়, ক্রেন দিয়ে ভারী জিনিস তোলা, ধাক্কা দেওয়া, ঘর্ষণ,
// মাধ্যাকর্ষণ বল, চুম্বকের আকর্ষণ) and English. The ball is always "ফুটবল": on this page বল means force. Units are
// the book's Latin symbols (cm, m/s; docs/book-notes.md). Use t('key') in code, and t.num() for numbers (Bangla digits
// when the language is Bangla).

const NONCONTACT = '<b class="c-noncontact">অস্পর্শ বল</b>';
const NONCONTACT_EN = '<b class="c-noncontact">non-contact force</b>';

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বল: চুম্বকের আকর্ষণ, একটি অস্পর্শ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the one action: what the student does in each example
    act_magnet: 'পেরেকের কাছে চুম্বক আনো',
    again_magnet: 'আবার চুম্বক আনো',

    // the one result line: at rest (the book's words for the example), while it is set up, and once the body moves
    rest_magnet: 'চুম্বকের আকর্ষণ: লোহার পেরেকটি টেবিলে স্থির।',
    pre_magnet: 'চুম্বক কাছে আনা হচ্ছে… পেরেক এখনো স্থির।',
    out_magnet: `চুম্বক পেরেকটিকে না ছুঁয়েই টানছে: ${NONCONTACT}`,
    end_magnet: 'পেরেকটি ছুটে গিয়ে চুম্বকে লেগে গেছে।',

    // the one rule: the book's definition of force first, then the two kinds as the student finds them
    rule_start: 'যার প্রয়োগের কারণে স্থির বস্তু চলতে শুরু করে আর গতিশীল বস্তুর বেগের পরিবর্তন হয়, সেটাই <b>বল</b>। দেখো, এই বল বস্তুকে ছোঁয় কি না।',
    kinds_noncontact: `${NONCONTACT} প্রয়োগ করতে স্পর্শ করতে হয় না, দূর থেকেই কাজ করে।`,
    eff_start: 'এখানে বলের প্রয়োগে স্থির বস্তু চলতে শুরু করল।',

    // in the 3D view: the tag at the contact patch or the gap, the force's name beside its arrow; in the panel's
    // action row: how time is shown
    tag_contact: 'ছুঁয়ে আছে: স্পর্শ বল',
    tag_noncontact: 'ছোঁয়নি: অস্পর্শ বল',
    tag_gap: 'ফাঁক {d} cm',
    f_magnet: 'চুম্বকের আকর্ষণ',
    f_comb: 'চিরুনির টান',
    f_this: 'এই বল',
    note_slow: 'সময় {k} গুণ ধীর',
    note_real: 'আসল সময়ে',
    note_held: 'থামিয়ে দেখানো',
    q_locked: 'পরীক্ষা চলছে: ছবিটি দেখে উত্তর বেছে নাও।',

    // the test
    q_comb: 'চুলে ঘষা চিরুনির দিকে কাগজের টুকরো লাফিয়ে উঠছে। চিরুনির এই টান কোন ধরনের বল?',
    k_comb_ok: 'অস্পর্শ বল: ফাঁক থেকেই কাগজ টানে',
    k_comb_hand: 'স্পর্শ বল: হাত চিরুনি ধরে আছে',
    k_comb_touch: 'স্পর্শ বল: কাগজ চিরুনিতে লেগে যায়',
    k_comb_light: 'অস্পর্শ বল: কাগজ খুব হালকা',
    why_comb: '<b>অস্পর্শ বল</b>: ছবিতে দেখো, চিরুনি আর কাগজের মাঝে {d} cm ফাঁক। চিরুনি ছোঁয়ার আগেই কাগজ উঠতে শুরু করে।',
    miss_k_comb_hand: '<b>অস্পর্শ বল</b>: হাত ছোঁয় চিরুনিকে, কাগজকে নয়। ছবিতে দেখো, কাগজ {d} cm ফাঁক থেকেই উঠতে শুরু করে।',
    miss_k_comb_touch: '<b>অস্পর্শ বল</b>: কাগজ লেগে যায় পরে। ছবিতে দেখো, ওঠা শুরু হয় {d} cm ফাঁক থেকে, ছোঁয়ার আগেই।',
    miss_k_comb_light: '<b>অস্পর্শ বল</b> ঠিকই, তবে হালকা বলে নয়: চিরুনি কাগজকে না ছুঁয়ে, {d} cm ফাঁক থেকে টানে।',
    q_eff: 'পেরেকটি চুম্বকের দিকে ছুটছে। চুম্বকের আকর্ষণ পেরেকটির কী করছে?',
    eff_faster: 'বেগ বাড়াচ্ছে',
    eff_slower: 'বেগ কমাচ্ছে',
    eff_same: 'বেগ একই রাখছে',
    eff_nothing: 'কিছুই করছে না',
    why_eff: '<b>বেগ বাড়াচ্ছে</b>: আকর্ষণ পেরেকের চলার দিকেই, তাই স্থির পেরেক চলতে শুরু করে আর ক্রমেই দ্রুত হয়। এটাই বলের কাজ।',
    miss_eff_slower: '<b>বেগ বাড়াচ্ছে</b>: আকর্ষণ পেরেকের চলার দিকেই, তাই বেগ কমে না, বাড়ে। দেখো, পেরেক ক্রমেই দ্রুত ছুটে চুম্বকে লাগে।',
    miss_eff_same: '<b>বেগ বাড়াচ্ছে</b>: পেরেকটি স্থির ছিল, এখন চলছে আর ক্রমেই দ্রুত হচ্ছে। বেগ একই থাকে না।',
    miss_eff_nothing: '<b>বেগ বাড়াচ্ছে</b>: না ছুঁয়েও চুম্বক টানে। তাই স্থির পেরেক চলতে শুরু করে, ক্রমেই দ্রুত হয়।',

    q_magnet: 'চুম্বকটি কাছে আনা হয়েছে, পেরেকটি তার দিকে ছুটছে। চুম্বকের এই টান কোন ধরনের বল?',
    k_magnet_ok: 'অস্পর্শ বল: না ছুঁয়েই পেরেক টানে',
    k_magnet_hand: 'স্পর্শ বল: হাত চুম্বক ধরে আছে',
    k_magnet_table: 'স্পর্শ বল: পেরেক টেবিল ছুঁয়ে আছে',
    k_magnet_small: 'অস্পর্শ বল: পেরেকটি খুব ছোট',
    why_magnet: '<b>অস্পর্শ বল</b>: ছবিতে দেখো, পেরেক আর চুম্বকের মাঝে {d} cm ফাঁক, কিছুই ছুঁয়ে নেই। তবু চুম্বক পেরেক টানে।',
    miss_k_magnet_hand: '<b>অস্পর্শ বল</b>: হাত ছোঁয় চুম্বককে, পেরেককে নয়। ছবিতে দেখো, পেরেক আর চুম্বকের মাঝে {d} cm ফাঁক।',
    miss_k_magnet_table: '<b>অস্পর্শ বল</b>: টেবিল পেরেককে চুম্বকের দিকে টানে না। টানে চুম্বক, {d} cm ফাঁক থেকে, না ছুঁয়ে।',
    miss_k_magnet_small: '<b>অস্পর্শ বল</b> ঠিকই, তবে ছোট বলে নয়: চুম্বক পেরেককে না ছুঁয়ে, {d} cm ফাঁক থেকে টানে।',

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
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Force: a magnet’s pull, a non-contact force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    act_magnet: 'Bring the magnet near the nail',
    again_magnet: 'Bring the magnet again',

    rest_magnet: 'The pull of a magnet: the iron nail is at rest on the table.',
    pre_magnet: 'The magnet is brought near… the nail is still at rest.',
    out_magnet: `The magnet pulls the nail without touching it: ${NONCONTACT_EN}`,
    end_magnet: 'The nail rushed onto the magnet.',

    rule_start:
      'A <b>force</b> is what makes a body at rest start moving and changes the velocity of a moving body. See whether this force touches the body.',
    kinds_noncontact: `A ${NONCONTACT_EN} needs no touching: it acts from a distance.`,
    eff_start: 'Here the force makes a body at rest start moving.',

    tag_contact: 'Touching: contact force',
    tag_noncontact: 'Not touching: non-contact force',
    tag_gap: 'Gap {d} cm',
    f_magnet: 'Pull of the magnet',
    f_comb: 'Pull of the comb',
    f_this: 'This force',
    note_slow: '{k} times slower',
    note_real: 'Real time',
    note_held: 'Paused to show',
    q_locked: 'The test is on: look at the picture and pick an answer.',

    q_comb: 'Bits of paper jump up to a comb rubbed on hair. What kind of force is the comb’s pull?',
    k_comb_ok: 'Non-contact: it pulls across the gap',
    k_comb_hand: 'Contact: the hand holds the comb',
    k_comb_touch: 'Contact: the paper sticks to the comb',
    k_comb_light: 'Non-contact: the paper is very light',
    why_comb: '<b>Non-contact force</b>: look, a gap of {d} cm between the comb and the paper. The paper starts to rise before it touches the comb.',
    miss_k_comb_hand: '<b>Non-contact force</b>: the hand touches the comb, not the paper. Look, the paper rises across a {d} cm gap.',
    miss_k_comb_touch: '<b>Non-contact force</b>: the paper sticks later. Look, it starts to rise across a {d} cm gap, before touching.',
    miss_k_comb_light: '<b>Non-contact force</b>, but not because the paper is light: the comb pulls it across a {d} cm gap.',
    q_eff: 'The nail rushes toward the magnet. What is the magnet’s pull doing to it?',
    eff_faster: 'Increasing its velocity',
    eff_slower: 'Decreasing its velocity',
    eff_same: 'Keeping its velocity the same',
    eff_nothing: 'Nothing',
    why_eff:
      '<b>Increasing its velocity</b>: the pull is in the direction the nail moves, so the nail at rest starts moving and speeds up. That is what a force does.',
    miss_eff_slower: '<b>Increasing its velocity</b>: the pull is in the direction the nail moves, so it speeds up. Watch it rush onto the magnet.',
    miss_eff_same: '<b>Increasing its velocity</b>: the nail was at rest, now it moves, faster and faster. Its velocity does not stay the same.',
    miss_eff_nothing: '<b>Increasing its velocity</b>: the magnet pulls without touching, so the nail starts moving and speeds up.',

    q_magnet: 'The magnet has been brought near and the nail rushes toward it. What kind of force is the magnet’s pull?',
    k_magnet_ok: 'Non-contact: it pulls the nail without touching',
    k_magnet_hand: 'Contact: the hand holds the magnet',
    k_magnet_table: 'Contact: the nail touches the table',
    k_magnet_small: 'Non-contact: the nail is very small',
    why_magnet: '<b>Non-contact force</b>: look, a gap of {d} cm between the nail and the magnet, nothing touching. Yet the magnet pulls the nail.',
    miss_k_magnet_hand: '<b>Non-contact force</b>: the hand touches the magnet, not the nail. Look, a {d} cm gap between the nail and the magnet.',
    miss_k_magnet_table: '<b>Non-contact force</b>: the table does not pull the nail toward the magnet. The magnet does, across a {d} cm gap.',
    miss_k_magnet_small: '<b>Non-contact force</b>, but not because the nail is small: the magnet pulls it across a {d} cm gap.',

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
