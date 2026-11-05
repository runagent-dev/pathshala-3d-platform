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
    title: 'বল: ক্রেনের টান, একটি স্পর্শ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'বল',

    // the one action: what the student does in each example
    act_crane: 'ক্রেন দিয়ে তোলো',
    again_crane: 'আবার তোলো',

    // the one result line: at rest (the book's words for the example), while it is set up, and once the body moves
    rest_crane: 'ক্রেন দিয়ে ভারী জিনিস তোলা: কংক্রিটের ব্লকটি এখন স্থির।',
    pre_crane: 'ক্রেনের তার টানটান হচ্ছে… ব্লক এখনো স্থির।',
    out_crane: `ক্রেনের তার ব্লকটিকে ছুঁয়ে টেনে তুলছে: ${CONTACT}`,
    end_crane: 'ব্লকটি উঠে ঝুলে আছে; ক্রেনের তার এখনো ছুঁয়ে আছে।',

    // the one rule: the book's definition of force first, then the two kinds as the student finds them
    rule_start: 'যার প্রয়োগের কারণে স্থির বস্তু চলতে শুরু করে আর গতিশীল বস্তুর বেগের পরিবর্তন হয়, সেটাই <b>বল</b>। দেখো, এই বল বস্তুকে ছোঁয় কি না।',
    kinds_contact: `${CONTACT} প্রয়োগ করতে হলে বস্তুকে স্পর্শ করতে হয়।`,
    eff_start: 'এখানে বলের প্রয়োগে স্থির বস্তু চলতে শুরু করল।',

    // in the 3D view: the tag at the contact patch or the gap, the force's name beside its arrow; in the panel's
    // action row: how time is shown
    tag_contact: 'ছুঁয়ে আছে: স্পর্শ বল',
    tag_noncontact: 'ছোঁয়নি: অস্পর্শ বল',
    tag_gap: 'ফাঁক {d} cm',
    f_crane: 'ক্রেনের টান',
    f_rope: 'দড়ির টান',
    f_parachute: 'বাতাসের বাধা',
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
    miss_k_rope_far: '<b>স্পর্শ বল</b>: মানুষটি দূরে, কিন্তু দড়ি দূর থেকে টানে না। ছবিতে দেখো, দড়ির মাথা গাড়ির আংটা ছুঁয়ে টানছে।',
    q_parachute: 'প্যারাসুট খোলা, তাই মানুষটি ধীরে নামছে। যে বল তাকে ধীরে নামাচ্ছে, তা কোন ধরনের?',
    k_para_ok: 'স্পর্শ বল: বাতাস কাপড়কে ছুঁয়ে বাধা দেয়',
    k_para_unseen: 'অস্পর্শ বল: বাতাস চোখে দেখা যায় না',
    k_para_gravity: 'অস্পর্শ বল: মাধ্যাকর্ষণ ধীরে নামায়',
    k_para_ground: 'স্পর্শ বল: মাটি নিচ থেকে ঠেলে',
    why_parachute: '<b>স্পর্শ বল</b>: ছবিতে দেখো, বাতাস প্যারাসুটের কাপড় ছুঁয়ে আছে। দেখা না গেলেও বাতাস কাপড়ে উপরের দিকে বাধা দেয়।',
    miss_k_para_unseen: '<b>স্পর্শ বল</b>: বাতাস দেখা না গেলেও আছে, আর প্যারাসুটের কাপড় ছুঁয়ে উপরের দিকে বাধা দেয় (ছবিতে দেখো)।',
    miss_k_para_gravity: '<b>স্পর্শ বল</b>: মাধ্যাকর্ষণ নিচে টানে, বেগ বাড়াতে চায়। ধীরে নামায় বাতাসের বাধা, যা কাপড় ছুঁয়ে আছে।',
    miss_k_para_ground: '<b>স্পর্শ বল</b>, তবে মাটির জন্য নয়: মানুষটি মাটি ছোঁয়নি। ছবিতে দেখো, বাতাস প্যারাসুটের কাপড় ছুঁয়ে বাধা দেয়।',

    q_crane: 'ক্রেনের তার কংক্রিটের ব্লকটিকে টেনে তুলছে। এই টান কোন ধরনের বল?',
    k_crane_ok: 'স্পর্শ বল: হুক ব্লকের আংটা ছুঁয়ে আছে',
    k_crane_up: 'অস্পর্শ বল: ব্লক উঠে গেছে, মাটি ছোঁয় না',
    k_crane_far: 'অস্পর্শ বল: ক্রেন ব্লক থেকে দূরে',
    k_crane_wheels: 'স্পর্শ বল: ক্রেনের চাকা মাটি ছুঁয়ে আছে',
    why_crane: '<b>স্পর্শ বল</b>: ছবিতে দেখো, ক্রেনের হুক ব্লকের আংটা ছুঁয়ে আছে। তার আর হুক ছুঁয়ে থেকেই ব্লকটিকে টেনে তোলে।',
    miss_k_crane_up: '<b>স্পর্শ বল</b>: ব্লক মাটি ছোঁয় না ঠিকই, কিন্তু টান আসে তার থেকে। ছবিতে দেখো, হুক ব্লকের আংটা ছুঁয়ে আছে।',
    miss_k_crane_far: '<b>স্পর্শ বল</b>: ক্রেন দূরে, কিন্তু তার দূর থেকে টানে না। ছবিতে দেখো, তারের হুক ব্লকের আংটা ছুঁয়ে টানছে।',
    miss_k_crane_wheels: '<b>স্পর্শ বল</b>, তবে চাকার জন্য নয়: টান আসে তার থেকে, আর হুক ব্লকের আংটা ছুঁয়ে আছে (ছবিতে দেখো)।',

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
    title: 'Force: a crane’s pull, a contact force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Force',

    act_crane: 'Lift with the crane',
    again_crane: 'Lift again',

    rest_crane: 'Lifting a heavy load with a crane: the concrete block is at rest.',
    pre_crane: 'The cable is tightening… the block is still at rest.',
    out_crane: `The crane’s cable touches the block and lifts it: ${CONTACT_EN}`,
    end_crane: 'The crane’s pull lifted the block and holds it; the cable still touches it.',

    rule_start:
      'A <b>force</b> is what makes a body at rest start moving and changes the velocity of a moving body. See whether this force touches the body.',
    kinds_contact: `A ${CONTACT_EN} can only be applied by touching the body.`,
    eff_start: 'Here the force makes a body at rest start moving.',

    tag_contact: 'Touching: contact force',
    tag_noncontact: 'Not touching: non-contact force',
    tag_gap: 'Gap {d} cm',
    f_crane: 'Pull of the crane',
    f_rope: 'Pull of the rope',
    f_parachute: 'Air resistance',
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
      '<b>Contact force</b>: the person is far, but a rope does not pull from a distance. Look, its end touches the cart’s ring and pulls.',
    q_parachute: 'The parachute is open, so the person comes down slowly. What kind of force slows the fall?',
    k_para_ok: 'Contact: the air touches the cloth and resists',
    k_para_unseen: 'Non-contact: air cannot be seen',
    k_para_gravity: 'Non-contact: gravity slows it down',
    k_para_ground: 'Contact: the ground pushes from below',
    why_parachute: '<b>Contact force</b>: look, the air touches the parachute’s cloth. You cannot see it, but it pushes up against the cloth.',
    miss_k_para_unseen: '<b>Contact force</b>: you cannot see the air, but it is there, touching the cloth and pushing up against it (look).',
    miss_k_para_gravity: '<b>Contact force</b>: gravity pulls down and would speed it up. The air touching the cloth slows it.',
    miss_k_para_ground:
      '<b>Contact force</b>, but not the ground: the person does not touch it. Look, the air touches the parachute’s cloth and resists.',

    q_crane: 'The crane’s cable lifts the concrete block. What kind of force is this pull?',
    k_crane_ok: 'Contact: the hook touches the block’s ring',
    k_crane_up: 'Non-contact: the block is off the ground',
    k_crane_far: 'Non-contact: the crane is far from the block',
    k_crane_wheels: 'Contact: the crane’s wheels touch the ground',
    why_crane: '<b>Contact force</b>: look, the crane’s hook touches the block’s ring. The cable and hook lift the block by touching it.',
    miss_k_crane_up:
      '<b>Contact force</b>: true, the block is off the ground, but the pull comes from the cable. Look, the hook touches the block’s ring.',
    miss_k_crane_far: '<b>Contact force</b>: the crane is far, but its cable does not pull from a distance. Look, the hook touches the block’s ring.',
    miss_k_crane_wheels:
      '<b>Contact force</b>, but not because of the wheels: the pull comes from the cable, whose hook touches the block’s ring (look).',

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
