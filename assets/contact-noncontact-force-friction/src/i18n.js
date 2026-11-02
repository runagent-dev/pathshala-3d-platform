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
    title: 'বল: ঘর্ষণ, একটি স্পর্শ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the one action: what the student does in each example
    act_friction: 'পিছলে যেতে দাও',
    again_friction: 'আবার পিছলে যেতে দাও',

    // the one result line: at rest (the book's words for the example), while it is set up, and once the body moves
    rest_friction: 'ঘর্ষণে চলন্ত বস্তুর থেমে যাওয়া: বাক্সটি পিছলে চলছে।',
    out_friction: `মেঝে বাক্সের তলা ছুঁয়ে ঘর্ষণে থামাচ্ছে: ${CONTACT}`,
    end_friction: 'ঘর্ষণে বাক্সের বেগ কমে শূন্য হলো, বাক্স থামল।',

    // the one rule: the book's definition of force first, then the two kinds as the student finds them
    rule_start: '<b>বল</b>: যার প্রয়োগের কারণে <b>স্থির বস্তু চলতে শুরু করে</b> আর <b>গতিশীল বস্তুর বেগের পরিবর্তন হয়</b>। দেখো, কোন বল বস্তুকে ছুঁয়ে কাজ করে।',
    kinds_contact: `${CONTACT} প্রয়োগ করতে হলে বস্তুকে <b>স্পর্শ করতে হয়</b>।`,
    eff_change: 'এখানে বলের প্রয়োগে <b>গতিশীল বস্তুর বেগের পরিবর্তন</b> হচ্ছে: বেগ কমছে।',

    // in the 3D view: the tag at the contact patch or the gap, the force's name beside its arrow; in the panel's
    // action row: how time is shown
    tag_contact: 'ছুঁয়ে আছে: স্পর্শ বল',
    tag_noncontact: 'ছোঁয়নি: অস্পর্শ বল',
    tag_gap: 'ফাঁক {d} cm',
    f_friction: 'মেঝের ঘর্ষণ',
    f_parachute: 'বাতাসের বাধা',
    f_this: 'এই বল',
    note_slow: 'সময় {k} গুণ ধীর',
    note_real: 'আসল সময়ে',
    note_held: 'থামিয়ে দেখানো',
    q_locked: 'পরীক্ষা চলছে: ছবিটি দেখে উত্তর বেছে নাও।',

    // the test
    q_parachute: 'প্যারাসুট খোলা, তাই মানুষটি ধীরে নামছে। যে বল তাকে ধীরে নামাচ্ছে, তা কোন ধরনের?',
    k_para_ok: 'স্পর্শ বল: বাতাস কাপড়কে ছুঁয়ে বাধা দেয়',
    k_para_unseen: 'অস্পর্শ বল: বাতাস চোখে দেখা যায় না',
    k_para_gravity: 'অস্পর্শ বল: মাধ্যাকর্ষণ ধীরে নামায়',
    k_para_ground: 'স্পর্শ বল: মাটি নিচ থেকে ঠেলে',
    why_parachute: '<b>স্পর্শ বল</b>: ছবিতে দেখো, বাতাস প্যারাসুটের কাপড় ছুঁয়ে আছে। দেখা না গেলেও বাতাস কাপড়ে উপরের দিকে বাধা দেয়।',
    miss_k_para_unseen: '<b>স্পর্শ বল</b>: বাতাস দেখা না গেলেও আছে, আর প্যারাসুটের কাপড় ছুঁয়ে উপরের দিকে বাধা দেয় (ছবিতে দেখো)।',
    miss_k_para_gravity: '<b>স্পর্শ বল</b>: মাধ্যাকর্ষণ নিচে টানে, বেগ বাড়াতে চায়; ধীরে নামায় বাতাসের বাধা, যা কাপড় ছুঁয়ে আছে।',
    miss_k_para_ground: '<b>স্পর্শ বল</b>, তবে মাটির জন্য নয়: মানুষটি মাটি ছোঁয়নি; ছবিতে দেখো, বাতাস প্যারাসুটের কাপড় ছুঁয়ে বাধা দেয়।',
    q_crate: 'বাক্সটিকে কেউ ঠেলছে না, তবু পিছলে চলতে চলতে থেমে যাচ্ছে। যে বল থামাচ্ছে, তা কোন ধরনের?',
    k_crate_ok: 'স্পর্শ বল: মেঝে বাক্সের তলা ছুঁয়ে আছে',
    k_crate_nobody: 'অস্পর্শ বল: কেউ বাক্সটিকে ছুঁয়ে নেই',
    k_crate_earth: 'অস্পর্শ বল: পৃথিবী নিচে টেনে থামায়',
    k_crate_push: 'স্পর্শ বল: আগের ধাক্কা এখনো ঠেলছে',
    why_crate: '<b>স্পর্শ বল</b>: ছবিতে দেখো, বাক্সের তলা মেঝে ছুঁয়ে আছে। কেউ না ঠেললেও মেঝের ঘর্ষণ ছুঁয়ে থেকে বাক্সকে থামায়।',
    miss_k_crate_nobody: '<b>স্পর্শ বল</b>: কোনো মানুষ ছুঁয়ে নেই ঠিকই, কিন্তু ছবিতে দেখো, মেঝে বাক্সের তলা ছুঁয়ে আছে; সেখানেই ঘর্ষণ।',
    miss_k_crate_earth: '<b>স্পর্শ বল</b>: পৃথিবীর টান নিচের দিকে, তা বাক্সকে পেছনে থামায় না; ছবিতে দেখো, মেঝে বাক্সের তলা ছুঁয়ে ঘর্ষণে থামায়।',
    miss_k_crate_push: '<b>স্পর্শ বল</b>, তবে ধাক্কার জন্য নয়: ধাক্কা শেষ, কিছু ঠেললে বাক্স থামত না; ছবিতে দেখো, মেঝে বাক্সের তলা ছুঁয়ে ঘর্ষণে থামায়।',
    eff_faster: 'বেগ বাড়াচ্ছে',
    eff_slower: 'বেগ কমাচ্ছে',
    eff_same: 'বেগ একই রাখছে',
    eff_nothing: 'কিছুই করছে না',

    q_eff: 'বাক্সটি পিছলে চলছে, মেঝের ঘর্ষণ তাকে বাধা দিচ্ছে। ঘর্ষণ বাক্সটির কী করছে?',
    why_eff: '<b>বেগ কমাচ্ছে</b>: ঘর্ষণ বাক্সের চলার উল্টো দিকে, তাই গতিশীল বাক্সের বেগ কমতে কমতে শূন্য হয়, বাক্স থামে। এটাও বলের কাজ।',
    miss_eff_faster: '<b>বেগ কমাচ্ছে</b>: ঘর্ষণ বাক্সের চলার উল্টো দিকে, তাই বেগ বাড়ে না, কমে; দেখো, বাক্স ধীর হয়ে থেমে যায়।',
    miss_eff_same: '<b>বেগ কমাচ্ছে</b>: বাক্সটি ক্রমেই ধীর হচ্ছে, শেষে থেমে যায়; বেগ একই থাকে না।',
    miss_eff_nothing: '<b>বেগ কমাচ্ছে</b>: ঘর্ষণ না থাকলে বাক্স একই বেগে চলতেই থাকত; ঘর্ষণের জন্যই তার বেগ কমে, বাক্স থামে।',

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
    title: 'Force: friction, a contact force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    act_friction: 'Let it slide',
    again_friction: 'Let it slide again',

    rest_friction: 'A moving body stopping because of friction: the crate is sliding.',
    out_friction: `The floor touches the crate’s bottom and slows it: ${CONTACT_EN}`,
    end_friction: 'Friction slowed the crate to zero velocity: it stopped.',

    rule_start:
      'A <b>force</b> is what makes <b>a body at rest start moving</b> and <b>changes the velocity of a moving body</b>. See which force acts by touching.',
    kinds_contact: `A ${CONTACT_EN} can only be applied by <b>touching</b> the body.`,
    eff_change: 'Here the force <b>changes the velocity of a moving body</b>: it slows down.',

    tag_contact: 'Touching: contact force',
    tag_noncontact: 'Not touching: non-contact force',
    tag_gap: 'Gap {d} cm',
    f_friction: 'Friction of the floor',
    f_parachute: 'Air resistance',
    f_this: 'This force',
    note_slow: '{k} times slower',
    note_real: 'Real time',
    note_held: 'Paused to show',
    q_locked: 'The test is on: look at the picture and pick an answer.',

    q_parachute: 'The parachute is open, so the person comes down slowly. What kind of force slows the fall?',
    k_para_ok: 'Contact: the air touches the cloth and resists',
    k_para_unseen: 'Non-contact: air cannot be seen',
    k_para_gravity: 'Non-contact: gravity slows it down',
    k_para_ground: 'Contact: the ground pushes from below',
    why_parachute: '<b>Contact force</b>: look, the air touches the parachute’s cloth. You cannot see it, but it pushes up against the cloth.',
    miss_k_para_unseen: '<b>Contact force</b>: you cannot see the air, but it is there, touching the cloth and pushing up against it (look).',
    miss_k_para_gravity: '<b>Contact force</b>: gravity pulls down and would speed it up; the air touching the cloth slows it.',
    miss_k_para_ground:
      '<b>Contact force</b>, but not the ground: the person does not touch it; look, the air touches the parachute’s cloth and resists.',
    q_crate: 'Nobody pushes the crate, yet it slides and comes to a stop. What kind of force stops it?',
    k_crate_ok: 'Contact: the floor touches the crate’s bottom',
    k_crate_nobody: 'Non-contact: nobody touches the crate',
    k_crate_earth: 'Non-contact: the Earth pulls it down to a stop',
    k_crate_push: 'Contact: the earlier push still pushes it',
    why_crate: '<b>Contact force</b>: look, the crate’s bottom touches the floor. Nobody pushes, but the floor’s friction touches it and stops it.',
    miss_k_crate_nobody:
      '<b>Contact force</b>: no person touches it, true, but look: the floor touches the crate’s bottom; that is where friction acts.',
    miss_k_crate_earth:
      '<b>Contact force</b>: the Earth pulls down, it does not hold the crate back; look, the floor touches the crate’s bottom and stops it.',
    miss_k_crate_push:
      '<b>Contact force</b>, but not a push: the push is over, and a push would not stop it; look, the floor touches the crate’s bottom.',
    eff_faster: 'Increasing its velocity',
    eff_slower: 'Decreasing its velocity',
    eff_same: 'Keeping its velocity the same',
    eff_nothing: 'Nothing',

    q_eff: 'The crate slides and the floor’s friction holds it back. What is friction doing to the crate?',
    why_eff:
      '<b>Decreasing its velocity</b>: friction acts against the crate’s motion, so the moving crate slows to zero velocity and stops. That too is what a force does.',
    miss_eff_faster: '<b>Decreasing its velocity</b>: friction acts against the motion, so the crate does not speed up; watch it slow down and stop.',
    miss_eff_same: '<b>Decreasing its velocity</b>: the crate gets slower and slower and stops; its velocity does not stay the same.',
    miss_eff_nothing:
      '<b>Decreasing its velocity</b>: without friction the crate would keep sliding at the same velocity; friction slows it and stops it.',

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
