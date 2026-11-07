// Every string the figure shows, in Bangla and English. The book's words on pages 272–273 (topic 10.1, আধান বা
// চার্জ): চার্জ বা আধান, পরমাণু, নিউক্লিয়াস, প্রোটন, নিউট্রন ("নিউট্রনের কোনো চার্জ নেই"), ইলেকট্রন, ধনাত্মক বা পজিটিভ,
// ঋণাত্মক বা নেগেটিভ, "প্রোটন আর ইলেকট্রনের চার্জ সমান কিন্তু বিপরীত", 1.6 × 10⁻¹⁹ Coulomb, বিদ্যুৎ নিরপেক্ষ বা
// নিস্তড়িৎ বা নিউট্রাল, কক্ষপথ, "এক কক্ষপথ পূর্ণ করে ইলেকট্রন পরের কক্ষপথে যায়" (চিত্র ১০.০১, আরগন), "ভেতরের কক্ষপথের
// ইলেকট্রনগুলো অনেক শক্তভাবে আটকে থাকে", "একটা ইলেকট্রন সরিয়ে নিলে পরমাণুটিতে একটি পজিটিভ চার্জ হয়, দুটি সরিয়ে নিলে
// দুটি পজিটিভ চার্জ হয়", আয়নিত বা আহিত, "বিচ্ছিন্ন একটি বা দুটি ইলেকট্রন পরমাণুর সাথে যুক্ত হয়ে যায়, তখন পরমাণুর মোট চার্জ হয়
// নেগেটিভ", ঘর্ষণ, লবণ (সোডিয়াম + ক্লোরিন). Use t('key', vars) in code and t.num() for numbers; numbers inside sentences come
// in as {vars}. intro / intro_short are the first screen's calm card (the short one for small frames); lead_* the line
// before the action; out_* the result; rule_* the rule, the book's term in bold. The questions (q_*) are plain text.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'আধান বা চার্জ: পরমাণুর ভেতরে প্রোটন আর ইলেকট্রন',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'চার্জের হিসাব',
    aria_stage: 'একটি আরগন পরমাণুর মডেল: মাঝে প্রোটন আর নিউট্রনের নিউক্লিয়াস, চারপাশে তিনটি কক্ষপথে ইলেকট্রন',
    aria_tally: 'প্রোটন {p}টি, ইলেকট্রন {e}টি',
    u_c: 'C',
    lbl_joined: 'যুক্ত হওয়া ইলেকট্রন',
    note_model: 'মডেল: মাপ প্রকৃত অনুপাতে নয়',

    // how to use the view
    howto_label: 'কীভাবে নাড়াবে',
    howto_orbit: 'ঘুরিয়ে দেখো',
    howto_front: 'শুরুর দৃশ্যে ফেরো',
    howto_tap: 'পরমাণুতে টোকা দাও',
    howto_tap_e: 'ইলেকট্রনে টোকা দাও',

    // the steps
    ex_label: 'ধাপ',
    ex_nucleus: 'নিউক্লিয়াস',
    ex_shells: 'ইলেকট্রন',
    ex_less: 'কম হলে',
    ex_more: 'বেশি হলে',

    // the action and the quiet buttons
    act_look: 'নিউক্লিয়াস দেখো',
    act_fill: 'ইলেকট্রন বসাও',
    act_remove: 'একটি ইলেকট্রন সরাও',
    act_add: 'ইলেকট্রন যোগ করো',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro: 'চিরুনিতে কাগজের টুকরা লেগে যাওয়া, বজ্রপাত, সবকিছুর মূলে আছে চার্জ বা আধান। সামনে একটি আরগন পরমাণুর মডেল। চলো দেখি, পরমাণুর ভেতরে চার্জ কোথায় থাকে।',
    intro_short: 'সামনে একটি আরগন পরমাণুর মডেল। চলো দেখি, এর ভেতরে চার্জ কোথায় থাকে।',

    // the line before the action: what the next tap will show
    lead_nucleus: 'এবার নিউক্লিয়াসের বাইরে, কক্ষপথে ইলেকট্রন বসাই।',
    lead_shells: 'বাইরের একটি ইলেকট্রন সরিয়ে নিলে কী হয়?',
    lead_less: 'একটি ইলেকট্রন বেশি হলে? ক্লোরিন পরমাণুতে দেখি।',
    lead_more: 'এবার নিজে যাচাই করো।',

    // the result line
    out_nucleus: 'আরগনের নিউক্লিয়াসে <b>{p}টি প্রোটন</b> (+) আর {n}টি নিউট্রন (চার্জ নেই)।',
    out_shells: '{sum}। ইলেকট্রন বসল {a}, {b}, {c} করে।',
    out_less: '{sum}: <b>{k}টি পজিটিভ চার্জ</b>, +{q}&nbsp;C।',
    out_less_0: '{sum}: মোট চার্জ আবার শূন্য।',
    out_more: '{sum}: <b>একটি নেগেটিভ চার্জ</b>, −{q}&nbsp;C।',
    out_more_0: '{sum}: ক্লোরিন এখন নিস্তড়িৎ।',

    // the rule: the book's words, the term in bold
    rule_nucleus: 'নিউক্লিয়াস তৈরি হয় প্রোটন আর নিউট্রন দিয়ে। প্রোটনের চার্জ <b>ধনাত্মক বা পজিটিভ</b>, নিউট্রনের কোনো চার্জ নেই।',
    rule_shells: 'ইলেকট্রনের চার্জ ঋণাত্মক, প্রোটনের সমান কিন্তু বিপরীত ({q}&nbsp;C)। সমান সংখ্যক বলে পরমাণু <b>বিদ্যুৎ নিরপেক্ষ বা নিস্তড়িৎ</b>।',
    rule_less: 'একটা ইলেকট্রন সরিয়ে নিলে একটি পজিটিভ চার্জ হয়, দুটি সরালে দুটি। পরমাণুটি <b>আয়নিত বা আহিত</b> হয়েছে।',
    rule_more: 'বিচ্ছিন্ন ইলেকট্রন যুক্ত হলে পরমাণুর মোট চার্জ হয় <b>নেগেটিভ</b>: এটিও আয়নিত।',

    // labels on the picture (short)
    lbl_nucleus: 'নিউক্লিয়াস',
    lbl_electron: 'ইলেকট্রন',
    lbl_orbit: 'কক্ষপথ',
    lbl_proton: 'প্রোটন (+)',
    lbl_neutron: 'নিউট্রন',
    lbl_shell: '{n}টি',
    lbl_net: '{atom}: মোট চার্জ {q}',
    lbl_removed: 'সরানো ইলেকট্রন',
    lbl_stray: 'বিচ্ছিন্ন ইলেকট্রন',
    atom_ar: 'আরগন',
    atom_cl: 'ক্লোরিন',
    tally_p: 'প্রোটন',
    tally_e: 'ইলেকট্রন',

    hint_wait: 'একটু দাঁড়াও, দেখো কী হয়।',
    hint_inner: 'ভেতরের কক্ষপথের ইলেকট্রন শক্তভাবে আটকে থাকে। বাইরেরটিতে টোকা দাও।',
    hint_nucleus: 'নিউক্লিয়াসের প্রোটন সরে না; সরে শুধু ইলেকট্রন।',
    hint_max: 'এখানে {n}টি পর্যন্ত সরানো যায়। ফেরাতে সরানো ইলেকট্রনে টোকা দাও।',
    hint_stray: 'বিচ্ছিন্ন ইলেকট্রনটিতে টোকা দাও।',

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
    q_locked: 'পরীক্ষার সময় দৃশ্যটি আটকানো থাকে। ছবি দেখে উত্তর বেছে নাও।',

    q_unsigned: 'নিউক্লিয়াসে যে বলগুলোর গায়ে কোনো চিহ্ন নেই, সেগুলো কী?',
    c_un_right: 'নিউট্রন, চার্জ নেই',
    c_un_proton: 'প্রোটন, চার্জ ধনাত্মক',
    c_un_electron: 'ইলেকট্রন, চার্জ ঋণাত্মক',
    c_un_neg: 'নিউট্রন, চার্জ ঋণাত্মক',
    why_unsigned: '<b>নিউট্রন</b>: এর চার্জ নেই, তাই চিহ্ন নেই। লাল বলগুলো প্রোটন (+)।',
    mis_un_proton: 'প্রোটনের গায়ে + চিহ্ন আছে।',
    mis_un_electron: 'ইলেকট্রন নিউক্লিয়াসের বাইরে, কক্ষপথে থাকে।',
    mis_un_neg: 'নিউট্রন চার্জবিহীন; ঋণাত্মক চার্জ ইলেকট্রনের।',

    q_zero: 'ছবির আরগন পরমাণুর মোট চার্জ শূন্য। কেন?',
    c_z_right: 'প্রোটন আর ইলেকট্রন সংখ্যায় সমান',
    c_z_neutron: 'নিউট্রন প্রোটনের চার্জ কাটিয়ে দেয়',
    c_z_spin: 'ইলেকট্রন ঘোরে বলে চার্জ থাকে না',
    c_z_small: 'নিউক্লিয়াস খুব ছোট বলে',
    why_zero: '<b>প্রোটন আর ইলেকট্রন সংখ্যায় সমান</b>: সমান কিন্তু বিপরীত চার্জ কাটাকাটি যায়।',
    mis_z_neutron: 'নিউট্রনের চার্জ নেই; + চার্জ কাটে ইলেকট্রনের − চার্জ।',
    mis_z_spin: 'ঘুরলেও প্রতিটি ইলেকট্রনের − চার্জ থাকে।',
    mis_z_small: 'ছোট হলেও নিউক্লিয়াসে প্রোটনের + চার্জ আছে।',

    q_move: 'একটি পরমাণু আহিত হলে কোন কণা আসা-যাওয়া করে?',
    c_mv_right: 'বাইরের কক্ষপথের ইলেকট্রন',
    c_mv_proton: 'নিউক্লিয়াসের প্রোটন',
    c_mv_neutron: 'নিউক্লিয়াসের নিউট্রন',
    c_mv_inner: 'ভেতরের কক্ষপথের ইলেকট্রন',
    why_move: '<b>বাইরের কক্ষপথের ইলেকট্রন</b>: একটু চেষ্টায় (যেমন ঘর্ষণে) আলাদা হয়; নিউক্লিয়াস বদলায় না।',
    mis_mv_proton: 'প্রোটন নিউক্লিয়াসেই থাকে; আসা-যাওয়া করে ইলেকট্রন।',
    mis_mv_neutron: 'নিউট্রনের চার্জ নেই; সরলেও চার্জ বদলাত না।',
    mis_mv_inner: 'ভেতরের কক্ষপথের ইলেকট্রন অনেক শক্তভাবে আটকে থাকে।',

    q_removed: 'ছবির নিস্তড়িৎ আরগন পরমাণু থেকে কয়েকটি ইলেকট্রন সরানো হলো। এখন পরমাণুর মোট চার্জ কত?',
    why_removed: '<b>{v}</b>: প্রোটন {p}টি, ইলেকট্রন {e}টি; {p} − {e} = {k}।',
    mis_rm_flip: 'ইলেকট্রন কমলে − চার্জ কমে, তাই + চার্জ বেশি থাকে।',
    mis_rm_zero: 'প্রোটন আর ইলেকট্রন এখন আর সমান নয়।',
    mis_rm_protons: 'শুধু প্রোটন নয়, ইলেকট্রনের − চার্জও গুনতে হবে।',

    q_extra: 'ছবির নিস্তড়িৎ ক্লোরিন পরমাণুর সাথে বিচ্ছিন্ন ইলেকট্রন যুক্ত হলো। এখন এর মোট চার্জ কত কুলম্ব?',
    why_extra: '<b>{v}</b>: একটি ইলেকট্রন বেশি; একটির চার্জ {q}&nbsp;কুলম্ব, নেগেটিভ।',
    mis_ex_flip: 'ইলেকট্রন বেশি হলে চার্জ নেগেটিভ হয়।',
    mis_ex_one: 'একটি ইলেকট্রনের চার্জ {one} কুলম্বের চেয়ে অনেক অনেক ছোট।',
    mis_ex_zero: 'প্রোটন {p}টি, ইলেকট্রন {e}টি: আর নিরপেক্ষ নয়।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Charge: protons and electrons inside an atom',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Counting the charge',
    aria_stage: 'A model of an argon atom: a nucleus of protons and neutrons in the middle, electrons on three orbits round it',
    aria_tally: '{p} protons, {e} electrons',
    u_c: 'C',
    lbl_joined: 'joined',
    note_model: 'A model: not to scale',

    howto_label: 'How to move it',
    howto_orbit: 'Turn the view',
    howto_front: 'Back to the start view',
    howto_tap: 'Tap the atom',
    howto_tap_e: 'Tap an electron',

    ex_label: 'Steps',
    ex_nucleus: 'Nucleus',
    ex_shells: 'Electrons',
    ex_less: 'Fewer',
    ex_more: 'More',

    act_look: 'See the nucleus',
    act_fill: 'Place the electrons',
    act_remove: 'Take one electron away',
    act_add: 'Add an electron',
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro:
      'Paper sticking to a comb, lightning: behind them all is electric charge. In front of you is a model of an argon atom. Let’s see where the charge is inside an atom.',
    intro_short: 'A model of an argon atom. Let’s see where the charge is inside it.',

    lead_nucleus: 'Now, outside the nucleus: let’s put the electrons on their orbits.',
    lead_shells: 'What happens if we take one outer electron away?',
    lead_less: 'And one electron too many? Let’s see, on a chlorine atom.',
    lead_more: 'Now check yourself.',

    out_nucleus: 'The argon nucleus has <b>{p} protons</b> (+) and {n} neutrons (no charge).',
    out_shells: '{sum}. The electrons sit {a}, {b}, {c}.',
    out_less: '{sum}: <b>{k} positive charge(s)</b>, +{q}&nbsp;C.',
    out_less_0: '{sum}: the total charge is zero again.',
    out_more: '{sum}: <b>one negative charge</b>, −{q}&nbsp;C.',
    out_more_0: '{sum}: chlorine is neutral now.',

    rule_nucleus: 'The nucleus is made of protons and neutrons. A proton’s charge is <b>positive</b>; a neutron has no charge.',
    rule_shells:
      'An electron’s charge is negative, equal and opposite to a proton’s ({q}&nbsp;C). As many of each, so the atom is <b>electrically neutral</b>.',
    rule_less: 'Take one electron away and the atom has one positive charge; two, and it has two. The atom is <b>ionised (charged)</b>.',
    rule_more: 'When a stray electron joins, the atom’s total charge becomes <b>negative</b>: it is ionised too.',

    lbl_nucleus: 'nucleus',
    lbl_electron: 'electron',
    lbl_orbit: 'orbit',
    lbl_proton: 'proton (+)',
    lbl_neutron: 'neutron',
    lbl_shell: '{n}',
    lbl_net: '{atom}: charge {q}',
    lbl_removed: 'removed',
    lbl_stray: 'stray electron',
    atom_ar: 'argon',
    atom_cl: 'chlorine',
    tally_p: 'protons',
    tally_e: 'electrons',

    hint_wait: 'Wait a moment and watch.',
    hint_inner: 'Electrons on the inner orbits are held tightly. Tap an outer one.',
    hint_nucleus: 'The nucleus’s protons don’t move; only electrons do.',
    hint_max: 'Here you can take up to {n}. Tap a taken electron to bring it back.',
    hint_stray: 'Tap the stray electron.',

    q_count: 'Question {i} of {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The scene is locked during the test. Look at the picture and pick an answer.',

    q_unsigned: 'In the nucleus, what are the balls with no sign on them?',
    c_un_right: 'Neutrons, no charge',
    c_un_proton: 'Protons, positive',
    c_un_electron: 'Electrons, negative',
    c_un_neg: 'Neutrons, negative',
    why_unsigned: '<b>Neutrons</b>: no charge, so no sign. The red balls are protons (+).',
    mis_un_proton: 'Protons carry the + sign.',
    mis_un_electron: 'Electrons are outside the nucleus, on the orbits.',
    mis_un_neg: 'Neutrons have no charge; the negative charge is the electron’s.',

    q_zero: 'The argon atom in the picture has zero total charge. Why?',
    c_z_right: 'As many protons as electrons',
    c_z_neutron: 'Neutrons cancel the protons’ charge',
    c_z_spin: 'Moving electrons lose their charge',
    c_z_small: 'The nucleus is very small',
    why_zero: '<b>As many protons as electrons</b>: equal and opposite charges cancel.',
    mis_z_neutron: 'Neutrons have no charge; the electrons’ − cancels the +.',
    mis_z_spin: 'Every electron keeps its − charge as it moves.',
    mis_z_small: 'Small as it is, the nucleus carries the protons’ + charge.',

    q_move: 'When an atom becomes charged, which particles come or go?',
    c_mv_right: 'Electrons of the outer orbit',
    c_mv_proton: 'Protons of the nucleus',
    c_mv_neutron: 'Neutrons of the nucleus',
    c_mv_inner: 'Electrons of the inner orbits',
    why_move: '<b>Outer electrons</b>: a little effort (rubbing, say) separates them; the nucleus never changes.',
    mis_mv_proton: 'Protons stay in the nucleus; electrons come and go.',
    mis_mv_neutron: 'Neutrons have no charge; moving them would change nothing.',
    mis_mv_inner: 'Inner electrons are held very tightly.',

    q_removed: 'Electrons were taken from this neutral argon atom. What is its total charge now?',
    why_removed: '<b>{v}</b>: {p} protons, {e} electrons; {p} − {e} = {k}.',
    mis_rm_flip: 'Fewer electrons means less − charge, so + is left over.',
    mis_rm_zero: 'Protons and electrons are no longer equal.',
    mis_rm_protons: 'Count the electrons’ − charge too, not only the protons.',

    q_extra: 'A stray electron joined this neutral chlorine atom. What is its total charge now, in coulombs?',
    why_extra: '<b>{v}</b>: one electron too many; each carries {q}&nbsp;C, negative.',
    mis_ex_flip: 'An extra electron makes the charge negative.',
    mis_ex_one: 'One electron’s charge is far, far smaller than {one} C.',
    mis_ex_zero: '{p} protons, {e} electrons: no longer neutral.',
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
