// Every string the figure shows, in Bangla (the book's words, page 67: বল, স্থির বস্তু চলতে শুরু করে, গতিশীল বস্তুর
// বেগের পরিবর্তন, স্পর্শ বল, অস্পর্শ বল, স্পর্শ করতে হয়, ক্রেন দিয়ে ভারী জিনিস তোলা, ধাক্কা দেওয়া, ঘর্ষণ,
// মাধ্যাকর্ষণ বল, চুম্বকের আকর্ষণ) and English. The ball is always "ফুটবল": on this page বল means force. Units are
// the book's Latin symbols (cm, m/s; docs/book-notes.md). Use t('key') in code, and t.num() for numbers (Bangla digits
// when the language is Bangla).

const CONTACT = '<b class="c-contact">স্পর্শ বল</b>';
const CONTACT_EN = '<b class="c-contact">contact force</b>';

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'বল: ধাক্কা, একটি স্পর্শ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the one action: what the student does in each example
    act_push: 'ধাক্কা দাও',
    again_push: 'আবার ধাক্কা দাও',

    // the one result line: at rest (the book's words for the example), while it is set up, and once the body moves
    rest_push: 'কোনো কিছুকে ধাক্কা দেওয়া: ট্রলির বাক্সটি এখন স্থির।',
    pre_push: 'হাত দুটি বাক্সে লাগছে… বাক্স এখনো স্থির।',
    out_push: `হাত বাক্সটিকে ছুঁয়ে ধাক্কা দিচ্ছে: ${CONTACT}`,
    end_push: 'হাত সরে গেছে; ধাক্কা আর নেই, ট্রলি গড়িয়ে থেমেছে।',

    // the one rule: the book's definition of force first, then the two kinds as the student finds them
    rule_start: '<b>বল</b>: যার প্রয়োগের কারণে <b>স্থির বস্তু চলতে শুরু করে</b> আর <b>গতিশীল বস্তুর বেগের পরিবর্তন হয়</b>। দেখো, কোন বল বস্তুকে ছুঁয়ে কাজ করে।',
    kinds_contact: `${CONTACT} প্রয়োগ করতে হলে বস্তুকে <b>স্পর্শ করতে হয়</b>।`,
    eff_start: 'এখানে বলের প্রয়োগে <b>স্থির বস্তু চলতে শুরু করল</b>।',

    // in the 3D view: the tag at the contact patch or the gap, the force's name beside its arrow; in the panel's
    // action row: how time is shown
    tag_contact: 'ছুঁয়ে আছে: স্পর্শ বল',
    tag_noncontact: 'ছোঁয়নি: অস্পর্শ বল',
    tag_gap: 'ফাঁক {d} cm',
    f_push: 'ধাক্কা',
    f_rope: 'দড়ির টান',
    f_this: 'এই বল',
    note_slow: 'সময় {k} গুণ ধীর',
    note_real: 'আসল সময়ে',
    note_held: 'থামিয়ে দেখানো',
    q_locked: 'পরীক্ষা চলছে: ছবিটি দেখে উত্তর বেছে নাও।',

    // the test
    q_rope: 'একজন দড়ি দিয়ে গাড়ি টেনে নিচ্ছে। গাড়ির উপর এই টান কোন ধরনের বল?',
    k_rope_ok: 'স্পর্শ বল: দড়ি গাড়িকে ছুঁয়ে আছে',
    k_rope_person: 'অস্পর্শ বল: মানুষটি গাড়ি ছোঁয়নি',
    k_rope_wheels: 'স্পর্শ বল: চাকা মাটি ছুঁয়ে আছে',
    k_rope_far: 'অস্পর্শ বল: দড়ি দূর থেকে টানে',
    why_rope: '<b>স্পর্শ বল</b>: ছবিতে দেখো, দড়ি গাড়ির আংটা ছুঁয়ে আছে। মানুষটি গাড়ি না ছুঁলেও দড়ি ছুঁয়ে টানে, ক্রেনের তারের মতো।',
    miss_k_rope_person: '<b>স্পর্শ বল</b>: মানুষটি গাড়ি ছোঁয়নি ঠিকই, কিন্তু ছবিতে দেখো, দড়ি গাড়ির আংটা ছুঁয়ে টানছে।',
    miss_k_rope_wheels: '<b>স্পর্শ বল</b>, তবে চাকার জন্য নয়: টান আসে দড়ি থেকে, আর দড়ি গাড়ির আংটা ছুঁয়ে আছে (ছবিতে দেখো)।',
    miss_k_rope_far: '<b>স্পর্শ বল</b>: মানুষটি দূরে, কিন্তু দড়ি দূর থেকে টানে না; ছবিতে দেখো, দড়ির মাথা গাড়ির আংটা ছুঁয়ে টানছে।',
    eff_faster: 'বেগ বাড়াচ্ছে',
    eff_slower: 'বেগ কমাচ্ছে',
    eff_same: 'বেগ একই রাখছে',
    eff_nothing: 'কিছুই করছে না',

    q_push: 'হাত দুটি বাক্সটিকে ঠেলে ট্রলিসহ চালাচ্ছে। এই ধাক্কা কোন ধরনের বল?',
    k_push_ok: 'স্পর্শ বল: হাত বাক্সটিকে ছুঁয়ে আছে',
    k_push_unseen: 'অস্পর্শ বল: বল চোখে দেখা যায় না',
    k_push_wheels: 'স্পর্শ বল: চাকা মেঝে ছুঁয়ে আছে',
    k_push_self: 'অস্পর্শ বল: বাক্সটি নিজেই চলছে',
    why_push: '<b>স্পর্শ বল</b>: ছবিতে দেখো, হাতের তালু বাক্সটিকে ছুঁয়ে আছে। ছুঁয়ে থেকেই হাত বাক্সটিকে ঠেলে চালায়।',
    miss_k_push_unseen: '<b>স্পর্শ বল</b>: বল চোখে দেখা যায় না ঠিকই, কিন্তু ছবিতে দেখো, হাতের তালু বাক্সটিকে ছুঁয়ে ঠেলছে।',
    miss_k_push_wheels: '<b>স্পর্শ বল</b>, তবে চাকার জন্য নয়: ধাক্কা আসে হাত থেকে, আর হাত বাক্সটিকে ছুঁয়ে আছে (ছবিতে দেখো)।',
    miss_k_push_self: '<b>স্পর্শ বল</b>: বাক্সটি স্থির ছিল, নিজে চলতে শুরু করেনি; ছবিতে দেখো, হাত তাকে ছুঁয়ে ঠেলছে, তাই চলছে।',
    q_eff: 'হাত দুটি ট্রলিটিকে ঠেলছে। এই ধাক্কা ট্রলিটির কী করছে?',
    why_eff: '<b>বেগ বাড়াচ্ছে</b>: ধাক্কা ট্রলির চলার দিকেই, তাই স্থির ট্রলি চলতে শুরু করে আর ক্রমেই দ্রুত হয়। এটাই বলের কাজ।',
    miss_eff_slower: '<b>বেগ বাড়াচ্ছে</b>: ধাক্কা ট্রলির চলার দিকেই, তাই বেগ কমে না, বাড়ে; দেখো, হাত ঠেলতে থাকলে ট্রলি ক্রমেই দ্রুত চলে।',
    miss_eff_same: '<b>বেগ বাড়াচ্ছে</b>: ট্রলিটি স্থির ছিল, এখন চলছে আর ক্রমেই দ্রুত হচ্ছে; বেগ একই থাকে না।',
    miss_eff_nothing: '<b>বেগ বাড়াচ্ছে</b>: হাত না ঠেললে ট্রলি স্থিরই থাকত; ধাক্কার জন্যই স্থির ট্রলি চলতে শুরু করে, ক্রমেই দ্রুত হয়।',

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
    title: 'Force: a push, a contact force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    act_push: 'Push',
    again_push: 'Push again',

    rest_push: 'Pushing something: the carton on the trolley is at rest.',
    pre_push: 'The hands reach the carton… it is still at rest.',
    out_push: `The hands touch the carton and push it: ${CONTACT_EN}`,
    end_push: 'The hands have let go; the push is over and the trolley rolled to a stop.',

    rule_start:
      'A <b>force</b> is what makes <b>a body at rest start moving</b> and <b>changes the velocity of a moving body</b>. See which force acts by touching.',
    kinds_contact: `A ${CONTACT_EN} can only be applied by <b>touching</b> the body.`,
    eff_start: 'Here the force makes <b>a body at rest start moving</b>.',

    tag_contact: 'Touching: contact force',
    tag_noncontact: 'Not touching: non-contact force',
    tag_gap: 'Gap {d} cm',
    f_push: 'Push',
    f_rope: 'Pull of the rope',
    f_this: 'This force',
    note_slow: '{k} times slower',
    note_real: 'Real time',
    note_held: 'Paused to show',
    q_locked: 'The test is on: look at the picture and pick an answer.',

    q_rope: 'Someone is pulling a cart with a rope. What kind of force is this pull on the cart?',
    k_rope_ok: 'Contact: the rope touches the cart',
    k_rope_person: 'Non-contact: the person does not touch the cart',
    k_rope_wheels: 'Contact: the wheels touch the ground',
    k_rope_far: 'Non-contact: the rope pulls from a distance',
    why_rope:
      '<b>Contact force</b>: look, the rope touches the cart’s ring. The person does not touch the cart, but the rope does and pulls it, like the crane’s cable.',
    miss_k_rope_person: '<b>Contact force</b>: true, the person does not touch the cart, but look: the rope touches its ring and pulls.',
    miss_k_rope_wheels: '<b>Contact force</b>, but not because of the wheels: the pull comes from the rope, which touches the cart’s ring (look).',
    miss_k_rope_far:
      '<b>Contact force</b>: the person is far, but a rope does not pull from a distance; look, its end touches the cart’s ring and pulls.',
    eff_faster: 'Increasing its velocity',
    eff_slower: 'Decreasing its velocity',
    eff_same: 'Keeping its velocity the same',
    eff_nothing: 'Nothing',

    q_push: 'The hands push the carton and its trolley along. What kind of force is this push?',
    k_push_ok: 'Contact: the hands touch the carton',
    k_push_unseen: 'Non-contact: a force cannot be seen',
    k_push_wheels: 'Contact: the wheels touch the floor',
    k_push_self: 'Non-contact: the carton moves by itself',
    why_push: '<b>Contact force</b>: look, the palms touch the carton. The hands push it along by touching it.',
    miss_k_push_unseen: '<b>Contact force</b>: true, a force cannot be seen, but look: the palms touch the carton and push it.',
    miss_k_push_wheels: '<b>Contact force</b>, but not because of the wheels: the push comes from the hands, which touch the carton (look).',
    miss_k_push_self: '<b>Contact force</b>: the carton was at rest and did not start by itself; look, the hands touch it and push it.',
    q_eff: 'The hands are pushing the trolley. What is the push doing to it?',
    why_eff:
      '<b>Increasing its velocity</b>: the push is in the direction the trolley moves, so the trolley at rest starts moving and speeds up. That is what a force does.',
    miss_eff_slower:
      '<b>Increasing its velocity</b>: the push is in the direction the trolley moves, so it speeds up; watch it go faster while the hands push.',
    miss_eff_same: '<b>Increasing its velocity</b>: the trolley was at rest, now it moves, faster and faster; its velocity does not stay the same.',
    miss_eff_nothing: '<b>Increasing its velocity</b>: without the push the trolley would stay at rest; the push makes it start moving and speed up.',

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
