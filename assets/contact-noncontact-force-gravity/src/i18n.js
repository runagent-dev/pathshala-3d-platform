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
    title: 'বল: মাধ্যাকর্ষণ, একটি অস্পর্শ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the one action: what the student does in each example
    act_fall: 'ফুটবলটি ছেড়ে দাও',
    again_fall: 'আবার ছেড়ে দাও',

    // the one result line: at rest (the book's words for the example), while it is set up, and once the body moves
    rest_fall: 'ছেড়ে দিলে নিচে পড়া: হাত দুটি ফুটবলটি ধরে আছে।',
    pre_fall: 'হাত দুটি সরে যাচ্ছে…',
    out_fall: `পৃথিবী ফুটবলটিকে না ছুঁয়েই নিচে টানছে: ${NONCONTACT}`,
    end_fall: 'ফুটবলটি পড়ে থেমেছে; এখন মেঝে তাকে ছুঁয়ে আছে।',

    // the one rule: the book's definition of force first, then the two kinds as the student finds them
    rule_start: '<b>বল</b>: যার প্রয়োগের কারণে <b>স্থির বস্তু চলতে শুরু করে</b> আর <b>গতিশীল বস্তুর বেগের পরিবর্তন হয়</b>। দেখো, কোন বল বস্তুকে ছুঁয়ে কাজ করে।',
    kinds_noncontact: `${NONCONTACT} প্রয়োগ করতে <b>স্পর্শ করতে হয় না</b>, দূর থেকেই কাজ করে।`,
    eff_both: 'এখানে <b>স্থির বস্তু চলতে শুরু করল</b>, তার বেগও বাড়ছে।',

    // in the 3D view: the tag at the contact patch or the gap, the force's name beside its arrow; in the panel's
    // action row: how time is shown
    tag_contact: 'ছুঁয়ে আছে: স্পর্শ বল',
    tag_noncontact: 'ছোঁয়নি: অস্পর্শ বল',
    tag_gap: 'ফাঁক {d} cm',
    f_fall: 'মাধ্যাকর্ষণ বল',
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
    why_comb: '<b>অস্পর্শ বল</b>: ছবিতে দেখো, চিরুনি আর কাগজের মাঝে {d} cm ফাঁক; চিরুনি ছোঁয়ার আগেই কাগজ উঠতে শুরু করে।',
    miss_k_comb_hand: '<b>অস্পর্শ বল</b>: হাত ছোঁয় চিরুনিকে, কাগজকে নয়; ছবিতে দেখো, কাগজ {d} cm ফাঁক থেকেই উঠতে শুরু করে।',
    miss_k_comb_touch: '<b>অস্পর্শ বল</b>: কাগজ লেগে যায় পরে; ছবিতে দেখো, ওঠা শুরু হয় {d} cm ফাঁক থেকে, ছোঁয়ার আগেই।',
    miss_k_comb_light: '<b>অস্পর্শ বল</b> ঠিকই, তবে হালকা বলে নয়: চিরুনি কাগজকে না ছুঁয়ে, {d} cm ফাঁক থেকে টানে।',
    q_ball: 'হাত সরে গেছে, ফুটবলটি পড়ছে। যে বল ফুটবলটিকে নিচে নামাচ্ছে, তা কোন ধরনের?',
    k_ball_ok: 'অস্পর্শ বল: পৃথিবী না ছুঁয়েই টানে',
    k_ball_air: 'স্পর্শ বল: বাতাস উপর থেকে ঠেলে',
    k_ball_floor: 'স্পর্শ বল: পৃথিবী মেঝে দিয়ে ছুঁয়ে আছে',
    k_ball_hands: 'অস্পর্শ বল: হাতের ধাক্কা এখনো আছে',
    why_ball: '<b>অস্পর্শ বল</b>: ছবিতে দেখো, ফুটবল আর মেঝের মাঝে {d} cm ফাঁক, কিছুই ছুঁয়ে নেই। তবু পৃথিবী টানে: মাধ্যাকর্ষণ বল।',
    miss_k_ball_air: '<b>অস্পর্শ বল</b>: বাতাস নিচে ঠেলে না, বরং একটু বাধা দেয়; ফুটবলকে টানে পৃথিবী, {d} cm ফাঁক থেকে, না ছুঁয়ে।',
    miss_k_ball_floor: '<b>অস্পর্শ বল</b>: ছবিতে দেখো, ফুটবল আর মেঝের মাঝে {d} cm ফাঁক; মেঝে ফুটবল ছোঁয়নি, তবু পৃথিবী টানে।',
    miss_k_ball_hands: '<b>অস্পর্শ বল</b> ঠিকই, তবে হাতের জন্য নয়: হাত সরে গেছে, ধাক্কা শেষ; ছবিতে দেখো, ফুটবল আর মেঝের মাঝে {d} cm ফাঁক, তবু পৃথিবী টানে।',
    eff_faster: 'বেগ বাড়াচ্ছে',
    eff_slower: 'বেগ কমাচ্ছে',
    eff_same: 'বেগ একই রাখছে',
    eff_nothing: 'কিছুই করছে না',

    q_eff: 'হাত সরে গেছে, ফুটবলটি পড়ছে। মাধ্যাকর্ষণ বল ফুটবলটির কী করছে?',
    why_eff: '<b>বেগ বাড়াচ্ছে</b>: মাধ্যাকর্ষণ বল নিচের দিকে, ফুটবলের চলার দিকেই; তাই স্থির ফুটবল পড়তে শুরু করে আর ক্রমেই দ্রুত হয়।',
    miss_eff_slower: '<b>বেগ বাড়াচ্ছে</b>: মাধ্যাকর্ষণ বল ফুটবলের চলার দিকেই টানে, তাই বেগ কমে না, বাড়ে; দেখো, ফুটবল ক্রমেই দ্রুত পড়ে।',
    miss_eff_same: '<b>বেগ বাড়াচ্ছে</b>: ফুটবলটি হাতে স্থির ছিল, এখন পড়ছে আর ক্রমেই দ্রুত হচ্ছে; বেগ একই থাকে না।',
    miss_eff_nothing: '<b>বেগ বাড়াচ্ছে</b>: না ছুঁয়েও পৃথিবী টানে; তাই ছেড়ে দিলে স্থির ফুটবল পড়তে শুরু করে, ক্রমেই দ্রুত হয়।',

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
    title: 'Force: gravity, a non-contact force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    act_fall: 'Let go of the football',
    again_fall: 'Let go again',

    rest_fall: 'Something let go falls: the hands hold the football.',
    pre_fall: 'The hands are moving apart…',
    out_fall: `The Earth pulls the football down without touching it: ${NONCONTACT_EN}`,
    end_fall: 'The football fell and lies on the floor; now the floor touches it.',

    rule_start:
      'A <b>force</b> is what makes <b>a body at rest start moving</b> and <b>changes the velocity of a moving body</b>. See which force acts by touching.',
    kinds_noncontact: `A ${NONCONTACT_EN} needs <b>no touching</b>: it acts from a distance.`,
    eff_both: 'Here <b>a body at rest starts moving</b>, and goes faster and faster.',

    tag_contact: 'Touching: contact force',
    tag_noncontact: 'Not touching: non-contact force',
    tag_gap: 'Gap {d} cm',
    f_fall: 'Gravity',
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
    why_comb: '<b>Non-contact force</b>: look, a gap of {d} cm between the comb and the paper; the paper starts to rise before it touches the comb.',
    miss_k_comb_hand: '<b>Non-contact force</b>: the hand touches the comb, not the paper; look, the paper rises across a {d} cm gap.',
    miss_k_comb_touch: '<b>Non-contact force</b>: the paper sticks later; look, it starts to rise across a {d} cm gap, before touching.',
    miss_k_comb_light: '<b>Non-contact force</b>, but not because the paper is light: the comb pulls it across a {d} cm gap.',
    q_ball: 'The hands have moved away and the football falls. What kind of force brings it down?',
    k_ball_ok: 'Non-contact: the Earth pulls without touching',
    k_ball_air: 'Contact: the air pushes it from above',
    k_ball_floor: 'Contact: the Earth touches it through the floor',
    k_ball_hands: 'Non-contact: the hands’ push is still in it',
    why_ball: '<b>Non-contact force</b>: look, a gap of {d} cm between the football and the floor; nothing touches it, yet the Earth pulls: gravity.',
    miss_k_ball_air: '<b>Non-contact force</b>: the air does not push it down, it resists a little; the Earth pulls it across a {d} cm gap.',
    miss_k_ball_floor:
      '<b>Non-contact force</b>: look, a {d} cm gap between the football and the floor; the floor does not touch it, yet the Earth pulls.',
    miss_k_ball_hands:
      '<b>Non-contact force</b>, but not the hands: they moved away, the push is over; look, a {d} cm gap below the football, yet the Earth pulls.',
    eff_faster: 'Increasing its velocity',
    eff_slower: 'Decreasing its velocity',
    eff_same: 'Keeping its velocity the same',
    eff_nothing: 'Nothing',

    q_eff: 'The hands have moved away and the football falls. What is gravity doing to it?',
    why_eff:
      '<b>Increasing its velocity</b>: gravity pulls down, the way the football moves, so the football at rest starts to fall and falls faster and faster.',
    miss_eff_slower: '<b>Increasing its velocity</b>: gravity pulls the way the football moves, so it speeds up; watch it fall faster and faster.',
    miss_eff_same:
      '<b>Increasing its velocity</b>: the football was at rest in the hands, now it falls faster and faster; its velocity does not stay the same.',
    miss_eff_nothing: '<b>Increasing its velocity</b>: the Earth pulls without touching, so the football let go starts to fall and speeds up.',

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
