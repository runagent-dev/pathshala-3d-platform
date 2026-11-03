// Every string the figure shows, in Bangla and English. The book's words, page 199 (topic 7.3, চিত্র ৭.১১): "কম্পন
// দিয়ে শব্দ তৈরি করার পর সেটিকে এক জায়গা থেকে অন্য জায়গায় প্রবাহিত করার জন্য একটা মাধ্যমের দরকার হয়", "তরল ও কঠিন
// পদার্থের ভেতর দিয়েও শব্দ প্রবাহিত করা যায়, কিন্তু আমরা বাতাসের মাধ্যমেই শব্দ শুনে অভ্যস্ত", "মাধ্যম ছাড়া যে শব্দ যেতে
// পারে না", জার, কলিং বেল, "বাইরে থেকে বিদ্যুৎ সরবরাহ করে বাজানো", পাম্প, "জারটিকে ধীরে ধীরে বায়ুশূন্য করা শুরু করলে কলিং
// বেলের শব্দ মৃদু হতে শুরু করে", "বেলজারটি পুরোপুরি বায়ুশূন্য করা হলে ভেতরে কলিং বেলটি কাঁপতে থাকলেও বাইরে থেকে কোনো শব্দ
// শোনা যায় না"; the caption "বেলজার থেকে বাতাস পাম্প করে সরিয়ে নিলে কলিং বেলে শব্দটি আর শোনা যাবে না"; page 200: "শব্দ একটি
// যান্ত্রিক তরঙ্গ … সেটি সঞ্চালনের জন্যও একটি স্থিতিস্থাপক মাধ্যমের দরকার হয়", "বায়বীয় মাধ্যমে এর বেগ কম, তরলে তার চেয়ে
// বেশি, কঠিন পদার্থে আরো বেশি". The page writes উপর. Use t('key', vars) in code and t.num() for numbers; numbers
// inside sentences come in as {vars}. A {key} that is not a var is another string of the same language (the unit
// {u_kpa}, after a no-break space). The questions (q_*) are plain text: the quiz writes them as text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'শব্দ সঞ্চালনে মাধ্যম',
    view: 'দেখার ধরন',
    view_front_short: 'আগের মতো দেখো',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    u_kpa: 'kPa',

    // the one button
    act_out: 'পাম্প চালিয়ে বায়ু বের করো',
    act_stop: 'পাম্প থামাও',
    act_more: 'আরও বায়ু বের করো',
    act_in: 'ভালভ খুলে বায়ু ঢোকাও',
    act_close: 'ভালভ বন্ধ করো',
    act_again: 'আবার বায়ু বের করো',
    act_reset: 'শুরুর অবস্থা',

    // the two meters
    m_air: 'জারে বাতাস',
    m_sound: 'বাইরে শব্দ',
    w_loud: 'জোরে',
    w_soft: 'মৃদু',
    w_faint: 'খুব মৃদু',
    w_none: 'শোনা যায় না',

    // one result line
    out_full: 'বাতাস ভরা জারে কলিং বেলের শব্দ <b>জোরে</b> শোনা যাচ্ছে।',
    out_pumping: 'পাম্প বাতাস সরাচ্ছে: জারে বাতাস <b>{p}%</b>, শব্দ মৃদু হচ্ছে…',
    out_paused: 'জারে বাতাস <b>{p}%</b>: বাইরে শব্দ {w}।',
    out_vacuum: 'জার বায়ুশূন্য: হাতুড়ি এখনো বাজছে, কিন্তু <b>কোনো শব্দ শোনা যায় না</b>।',
    out_filling: 'বাতাস ঢুকছে: জারে বাতাস <b>{p}%</b>, শব্দ ফিরে আসছে…',
    out_back: 'বাতাস ফিরেছে, শব্দও আবার <b>জোরে</b> শোনা যাচ্ছে।',

    // one rule, growing
    rule_start: 'কম্পন দিয়ে শব্দ তৈরি হয়; সেটি এক জায়গা থেকে অন্য জায়গায় যেতে <b>একটা মাধ্যমের দরকার</b> হয়। জারের বাতাস সরালে কী হয়, দেখো।',
    rule_fading: '<b>জারটিকে ধীরে ধীরে বায়ুশূন্য করা শুরু করলে কলিং বেলের শব্দ মৃদু হতে শুরু করে।</b> হাতুড়ি কিন্তু আগের মতোই আঘাত করছে।',
    rule_vacuum: '<b>বেলজারটি পুরোপুরি বায়ুশূন্য করা হলে ভেতরে কলিং বেলটি কাঁপতে থাকলেও বাইরে থেকে কোনো শব্দ শোনা যায় না।</b> এবার বাতাস ফিরিয়ে দাও।',
    rule_law: '<b>মাধ্যম ছাড়া শব্দ যেতে পারে না।</b> শব্দ একটি যান্ত্রিক তরঙ্গ: এর সঞ্চালনের জন্য বাতাস, তরল বা কঠিন পদার্থের মতো একটি স্থিতিস্থাপক মাধ্যম দরকার।',
    note: 'বিন্দুগুলো বাতাসের কণা, বৃত্তগুলো শব্দ তরঙ্গ (অনেক ধীর করে দেখানো; আসলে বাতাসে {c}&nbsp;m/s)।',

    // the graph (wide panels)
    g_title: 'শব্দের জোর ও জারের বাতাস',
    g_x: 'জারে বাতাস (%)',
    g_y: 'শব্দের জোর',
    g_aria: 'লেখচিত্র: জারে বাতাস যত কম, বাইরে শব্দ তত মৃদু',

    // labels on the picture
    lbl_jar: 'বেলজার',
    lbl_bell: 'কলিং বেল',
    lbl_pump: 'পাম্প',
    lbl_gauge: 'চাপ {p}&nbsp;{u_kpa}',
    lbl_hammer: 'হাতুড়ি বাজছে',
    lbl_valve: 'ভালভ',

    hint_locked: 'পরীক্ষার সময় পাম্প আর ভালভ আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় পাম্প আর ভালভ আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_gauge: 'গেজের কাঁটা দেখো। জারে বাতাসের চাপ এখন কত?',
    why_gauge: '<b>{v}&nbsp;{u_kpa}</b>: স্কেলের {z} বাঁ দিকে নিচে; কাঁটা {v}-এর দাগে।',
    mis_g_flip: 'তুমি ডান দিক থেকে গুনেছ; স্কেল শুরু বাঁ দিকের {z} থেকে।',
    mis_g_full: '{pa}&nbsp;{u_kpa} ভরা জারের চাপ; পাম্প এর মধ্যে কিছু বাতাস সরিয়েছে।',
    mis_g_empty: '{z} মানে জারে কোনো বাতাস নেই; কাঁটা {z}-তে নেই।',

    q_fade: 'পাম্প চালিয়ে জারের অর্ধেক বাতাস বের করা হলো। বেলের শব্দ মৃদু হলো কেন?',
    c_fade_right: 'শব্দ বয়ে নেওয়ার বাতাস কমে গেছে',
    c_fade_weak: 'হাতুড়ি আগের চেয়ে আস্তে আঘাত করছে',
    c_fade_pump: 'পাম্পের আওয়াজে বেলের শব্দ ঢাকা পড়েছে',
    c_fade_cell: 'ব্যাটারির শক্তি কমে গেছে',
    why_fade: '<b>শব্দ বয়ে নেওয়ার বাতাস কমে গেছে</b>: শব্দ যেতে মাধ্যম দরকার, আর ছবিতে বাতাসের কণা আগের অর্ধেক।',
    mis_fade_weak: 'ছবিতে হাতুড়ি একই হারে, একই দূর থেকে আঘাত করছে।',
    mis_fade_pump: 'পাম্প এখন থামানো, তবু শব্দ মৃদু: বাতাস ঢোকার আগে তা আর বাড়ে না।',
    mis_fade_cell: 'ভালভ খুলে বাতাস ঢোকালেই শব্দ ফিরে আসে; ব্যাটারি একই থাকে।',

    q_hammer: 'জারটি এখন বায়ুশূন্য। বেলটি ভালো করে দেখো। কোনটি ঠিক?',
    c_ham_right: 'হাতুড়ি বাজছে, কিন্তু শব্দ বাইরে আসছে না',
    c_ham_stop: 'হাতুড়ি থেমে গেছে, তাই কোনো শব্দ নেই',
    c_ham_glass: 'শব্দ হচ্ছে, কিন্তু কাচ সেটি আটকে দিচ্ছে',
    c_ham_power: 'বাতাস না থাকায় বেলে বিদ্যুৎ যাচ্ছে না',
    why_hammer: '<b>হাতুড়ি এখনো ঘণ্টায় আঘাত করছে</b>, কিন্তু জারে শব্দ বয়ে নেওয়ার মাধ্যম (বাতাস) নেই, তাই বাইরে শব্দ আসে না।',
    mis_ham_stop: 'ছবিতে হাতুড়িটি আগের মতোই নড়ছে: বেলটি বাজছে।',
    mis_ham_glass: 'বাতাস ভরা থাকলে এই কাচ পেরিয়েই শব্দ শোনা যায়।',
    mis_ham_power: 'বিদ্যুৎ যায় তারের ভেতর দিয়ে, বাতাস দিয়ে নয়; হাতুড়ি তো নড়ছে।',

    q_water: 'জারে বাতাসের বদলে পানি ভরা হলো (বেলটি পানিতে নষ্ট হয় না ধরো)। বাইরে কি বেলের শব্দ যাবে?',
    c_w_right: 'হ্যাঁ, পানিও শব্দের একটি মাধ্যম',
    c_w_slow: 'হ্যাঁ, তবে বাতাসের চেয়ে ধীরে যাবে',
    c_w_air: 'না, শব্দ শুধু বাতাসের ভেতরেই যায়',
    c_w_vib: 'না, পানিতে কম্পন ছড়াতে পারে না',
    why_water: '<b>হ্যাঁ, যাবে</b>: তরল ও কঠিন পদার্থের ভেতর দিয়েও শব্দ প্রবাহিত হয়; পানিতে শব্দের বেগ বাতাসের চেয়ে বেশি (প্রায় {cw}&nbsp;m/s)।',
    mis_w_slow: 'বায়বীয় মাধ্যমে শব্দের বেগ কম, তরলে তার চেয়ে বেশি।',
    mis_w_air: 'বাতাসে শুনে আমরা অভ্যস্ত, তাই এমন মনে হয়; তরল ও কঠিনেও শব্দ যায়।',
    mis_w_vib: 'পানির কণাও কাঁপতে পারে, তাই পানিতে শব্দ যায়।',

    q_moon: 'চাঁদে বাতাস নেই। এক নভোচারী একটি ঘণ্টা বাজালেন; পাশের নভোচারী (কিছু না ছুঁয়ে) কী শুনবেন?',
    c_m_right: 'কিছুই শুনবেন না',
    c_m_soft: 'খুব মৃদু শব্দ শুনবেন',
    c_m_loud: 'পৃথিবীর মতোই শুনবেন',
    c_m_late: 'একটু দেরিতে শুনবেন',
    why_moon: '<b>কিছুই শুনবেন না</b>: বায়ুশূন্য বেলজারের মতো, চাঁদে শব্দ বয়ে নেওয়ার কোনো মাধ্যম নেই।',
    mis_m_soft: 'মৃদু শব্দ আসে কিছু বাতাস থাকলে; চাঁদে বাতাস একেবারেই নেই।',
    mis_m_loud: 'ঘণ্টা কাঁপলেও মাধ্যম ছাড়া শব্দ যেতে পারে না।',
    mis_m_late: 'দেরি নয়: মাধ্যম না থাকলে শব্দ পৌঁছায়ই না।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Sound needs a medium',
    view: 'View',
    view_front_short: 'Back to the start view',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    u_kpa: 'kPa',

    act_out: 'Run the pump: take the air out',
    act_stop: 'Stop the pump',
    act_more: 'Take more air out',
    act_in: 'Open the valve: let air in',
    act_close: 'Close the valve',
    act_again: 'Take the air out again',
    act_reset: 'Start again',

    m_air: 'Air in the jar',
    m_sound: 'Sound outside',
    w_loud: 'loud',
    w_soft: 'softer',
    w_faint: 'very faint',
    w_none: 'not heard',

    out_full: 'With the jar full of air the calling bell sounds <b>loud</b>.',
    out_pumping: 'The pump takes the air out: <b>{p}%</b> left, the sound grows softer…',
    out_paused: '<b>{p}%</b> of the air left: outside, the sound is {w}.',
    out_vacuum: 'No air in the jar: the hammer still strikes, but <b>no sound is heard</b>.',
    out_filling: 'Air comes in: <b>{p}%</b> in the jar, the sound comes back…',
    out_back: 'The air is back, and the sound is <b>loud</b> again.',

    rule_start:
      'Sound is made by vibration; to travel from one place to another it <b>needs a medium</b>. Watch what happens when the air is taken out of the jar.',
    rule_fading: '<b>As the jar is slowly emptied of air, the calling bell grows softer.</b> The hammer still strikes as before.',
    rule_vacuum:
      '<b>With the bell jar fully emptied of air, no sound is heard outside although the calling bell inside keeps vibrating.</b> Now let the air back in.',
    rule_law:
      '<b>Without a medium sound cannot travel.</b> Sound is a mechanical wave: it needs an elastic medium, such as air, a liquid or a solid, to travel.',
    note: 'The dots stand for the air’s particles, the rings for the sound wave (shown much slowed down; in air sound travels at {c}&nbsp;m/s).',

    g_title: 'How loud, and the air in the jar',
    g_x: 'Air in the jar (%)',
    g_y: 'How loud',
    g_aria: 'Graph: the less air in the jar, the softer the sound outside',

    lbl_jar: 'Bell jar',
    lbl_bell: 'Calling bell',
    lbl_pump: 'Pump',
    lbl_gauge: 'Pressure {p}&nbsp;{u_kpa}',
    lbl_hammer: 'The hammer strikes',
    lbl_valve: 'Valve',

    hint_locked: 'The pump and the valve stay put during the test. Look at the picture and pick an answer.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The pump and the valve stay put during the test. Look at the picture and pick an answer.',

    q_gauge: 'Look at the gauge’s needle. What is the air pressure in the jar now?',
    why_gauge: '<b>{v}&nbsp;{u_kpa}</b>: the scale’s {z} is low on the left; the needle is on the {v} mark.',
    mis_g_flip: 'You counted from the right; the scale starts from the {z} on the left.',
    mis_g_full: '{pa}&nbsp;{u_kpa} is a full jar; the pump has already taken some air out.',
    mis_g_empty: '{z} would mean no air at all; the needle is not on {z}.',

    q_fade: 'The pump has taken half the air out of the jar. Why is the bell softer?',
    c_fade_right: 'There is less air to carry the sound',
    c_fade_weak: 'The hammer strikes more gently than before',
    c_fade_pump: 'The pump’s noise drowns the bell',
    c_fade_cell: 'The battery has run down',
    why_fade: '<b>There is less air to carry the sound</b>: sound needs a medium, and the picture shows half as many air particles.',
    mis_fade_weak: 'In the picture the hammer strikes at the same rate, from as far back.',
    mis_fade_pump: 'The pump is stopped now, yet the sound stays soft until air comes back in.',
    mis_fade_cell: 'Open the valve and the sound comes back; the battery is the same.',

    q_hammer: 'The jar is now empty of air. Look closely at the bell. Which is right?',
    c_ham_right: 'The hammer strikes, but no sound comes out',
    c_ham_stop: 'The hammer has stopped, so there is no sound',
    c_ham_glass: 'There is sound, but the glass blocks it',
    c_ham_power: 'With no air, no current reaches the bell',
    why_hammer: '<b>The hammer still strikes the gong</b>, but there is no medium (air) in the jar to carry the sound, so none comes out.',
    mis_ham_stop: 'In the picture the hammer moves as before: the bell is ringing.',
    mis_ham_glass: 'With the jar full of air the sound is heard through this same glass.',
    mis_ham_power: 'The current flows through the wires, not the air; and the hammer is moving.',

    q_water: 'The jar is filled with water instead of air (say the bell is not harmed). Will the bell’s sound get out?',
    c_w_right: 'Yes, water is a medium for sound too',
    c_w_slow: 'Yes, but more slowly than in air',
    c_w_air: 'No, sound travels only through air',
    c_w_vib: 'No, vibrations cannot spread in water',
    why_water: '<b>Yes</b>: sound travels through liquids and solids too; in water it is even faster than in air (about {cw}&nbsp;m/s).',
    mis_w_slow: 'Sound is slow in a gas, faster in a liquid.',
    mis_w_air: 'We are used to hearing through air, so it seems so; liquids and solids carry sound too.',
    mis_w_vib: 'Water’s particles can vibrate too, so sound travels in water.',

    q_moon: 'There is no air on the Moon. One astronaut rings a bell; what does the one beside her hear (touching nothing)?',
    c_m_right: 'Nothing at all',
    c_m_soft: 'A very faint sound',
    c_m_loud: 'The same as on Earth',
    c_m_late: 'The sound a little later',
    why_moon: '<b>Nothing at all</b>: like the empty bell jar, there is no medium on the Moon to carry the sound.',
    mis_m_soft: 'A faint sound needs some air; the Moon has none at all.',
    mis_m_loud: 'The bell vibrates, but without a medium the sound cannot travel.',
    mis_m_late: 'Not later: without a medium the sound never arrives.',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBanglaDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[d]);

/**
 * t(key, vars) with t.num and t.lang. Missing Bangla falls back to English, a missing key shows the key. A {name} that
 * is not in vars but is a string of the same language (a unit) is put in.
 */
export function createI18n(lang = 'bn', { numerals = null } = {}) {
  const code = STRINGS[lang] ? lang : 'bn';
  const dict = { ...STRINGS.en, ...STRINGS[code] };
  const bangla = (numerals || (code === 'bn' ? 'bn' : 'latin')) === 'bn';
  const num = (x) => (bangla ? toBanglaDigits(x) : String(x));
  function t(key, vars) {
    let s = dict[key] ?? key;
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? num(vars[k]) : k in dict ? dict[k] : m));
    return s;
  }
  t.num = num;
  t.lang = code;
  return t;
}
