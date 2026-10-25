// Every string the figure shows, in Bangla (as the book, page 68, 3.2.3: দুর্বল নিউক্লীয় বল, তড়িৎ চৌম্বক বল,
// মহাকর্ষ বল, দূরত্ব, তেজস্ক্রিয় নিউক্লিয়াস, বিটা (β) রশ্মি, ইলেকট্রন; পাল্লা as in 3.2.1–3.2.2) and English.
// Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla). {r}, {r15}, {r10} and
// {atom} are powers of ten the app writes (10⁻¹⁸ m …), already in the right digits.

export const STRINGS = {
  bn: {
    title: 'দুর্বল নিউক্লীয় বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'নিউক্লিয়াস',

    // the zoom
    stops_label: 'কী দেখবে',
    stop_atom: 'পরমাণু',
    stop_nucleus: 'নিউক্লিয়াস',
    stop_reach: 'দুর্বল বলের পাল্লা',
    stop_reach_short: 'পাল্লা',
    act_beta: 'β রশ্মি দেখো',
    act_again: 'আবার দেখো',

    // what the panel says, for each thing on the screen
    idea_nucleus:
      'তেজস্ক্রিয় নিউক্লিয়াস থেকে যে <b class="c-e">বিটা (β) রশ্মি বা ইলেকট্রন</b> বের হয়, সেটার কারণ <b class="c-weak">দুর্বল নিউক্লীয় বল</b>। নিউক্লিয়াসে চাপ দিয়ে দেখো।',
    idea_change: 'নিউক্লিয়াসের ভেতরে <b class="c-weak">দুর্বল নিউক্লীয় বল</b> কাজ করছে: একটি নিউট্রন বদলে যাচ্ছে…',
    idea_done:
      '<b class="c-weak">দুর্বল নিউক্লীয় বলের</b> কারণে একটি নিউট্রন প্রোটন হয়ে গেল (প্রোটন <b class="c-p wn-nw">{p0} → {p1}</b>, নিউট্রন <b class="c-n wn-nw">{n0} → {n1}</b>), আর একটি <b class="c-e">ইলেকট্রন</b> বেরিয়ে এল: এটাই বিটা (β) রশ্মি।',
    idea_atom:
      'পরমাণুর মাপ প্রায় {atom}। ইলেকট্রনকে টানে তড়িৎ চৌম্বক বল, যা যেকোনো দূরত্ব থেকে কাজ করে; কিন্তু <b class="c-weak">দুর্বল নিউক্লীয় বলের</b> পাল্লা এর দশ কোটি ভাগের এক ভাগ ({r})।',
    idea_reach:
      '<b class="c-weak">দুর্বল নিউক্লীয় বল</b> কাজ করে মাত্র {r} দূরত্বে; এই গোলকের বাইরে এটি কাজ করে না। নিউট্রন একটি ফুটবলের সমান হলে এই পাল্লা হতো একটি বালুকণার মতো।',

    // the four forces (forces.json: weakest first; the heading as in the other three force figures)
    forces_title: 'চার মৌলিক বল (সবচেয়ে দুর্বল → সবচেয়ে শক্তিশালী)',
    f_gravity: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',
    range_inf: 'পাল্লা অসীম',
    range_is: 'পাল্লা {r}',
    strength_book: '<b class="c-weak">দুর্বল নিউক্লীয় বল</b> তড়িৎ চৌম্বক বল থেকে দুর্বল (প্রায় ট্রিলিয়ন গুণ), কিন্তু মোটেও মহাকর্ষ বলের মতো এত দুর্বল নয়।',

    // labels on the 3D
    label_proton: 'প্রোটন',
    label_neutron: 'নিউট্রন',
    label_weak: 'দুর্বল নিউক্লীয় বল',
    label_weak_2: 'দুর্বল<br>নিউক্লীয় বল',
    label_beta: 'বিটা (β) রশ্মি বা ইলেকট্রন',
    label_beta_2: 'বিটা (β) রশ্মি<br>বা ইলেকট্রন',
    label_beta_q: 'বিটা (β) রশ্মি = ?',
    label_new: 'নিউট্রন → প্রোটন',
    label_new_2: 'নিউট্রন<br>→ প্রোটন',
    label_electron: 'ইলেকট্রন',
    label_nucleus: 'নিউক্লিয়াস',
    label_reach: 'দুর্বল নিউক্লীয় বলের পাল্লা',
    label_reach_2: 'দুর্বল নিউক্লীয়<br>বলের পাল্লা',
    label_atom_size: 'পরমাণু: প্রায় {s}',
    label_unknown: '?',
    note_base: 'ছবি প্রতীকী',
    note_slow: 'ছবি প্রতীকী; সময় অনেক ধীর করে দেখানো',
    note_atom: 'ছবি প্রতীকী; নিউক্লিয়াস আর ইলেকট্রন বড় করে আঁকা',
    note_reach: 'একটি নিউট্রনের ভেতরে (ছবি প্রতীকী)',
    scale_label: 'মাপকাঠি',
    scale_of_neutron: 'নিউট্রনের {n} ভাগের এক ভাগ',

    coach_tap: 'নিউক্লিয়াসে চাপ দাও',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',
    hint_wait: 'একটু দাঁড়াও: আগেরটা এখনো চলছে।',

    // the test
    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবি দেখে, ভেবে সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি। সঠিক উত্তর',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবি বদলানো যায় না। প্রশ্ন পড়ে উত্তর বেছে নাও।',

    q_cause: 'নিউক্লিয়াস থেকে এই বিটা (β) রশ্মি বের হলো কোন বলের কারণে?',
    c_weak: 'দুর্বল নিউক্লীয় বল',
    c_strong: 'সবল নিউক্লীয় বল',
    c_em: 'তড়িৎ চৌম্বক বল',
    c_gravity: 'মহাকর্ষ বল',
    cause_why: '<b>দুর্বল নিউক্লীয় বল</b>: বিটা (β) রশ্মি বা ইলেকট্রন বের হওয়ার কারণ এই বল।',
    cause_answer: '<b>দুর্বল নিউক্লীয় বল</b>।',
    cause_m_strong: 'সবল নিউক্লীয় বল নিউক্লিয়াসকে ধরে রাখে; বিটা (β) রশ্মির কারণ দুর্বল নিউক্লীয় বল।',
    cause_m_em: 'ইলেকট্রনের আধান আছে বলে তড়িৎ চৌম্বক বল মনে হতে পারে, কিন্তু নিউট্রনকে প্রোটনে বদলায় দুর্বল নিউক্লীয় বল।',
    cause_m_gravity: 'এত ছোট কণার মধ্যে মহাকর্ষ বল খুবই দুর্বল; বিটা (β) রশ্মির কারণ দুর্বল নিউক্লীয় বল।',

    q_what: 'নিউক্লিয়াস থেকে বের হওয়া বিটা (β) রশ্মি আসলে কী?',
    w_electron: 'ইলেকট্রন',
    w_proton: 'প্রোটন',
    w_neutron: 'নিউট্রন',
    w_light: 'আলো',
    what_why: '<b>ইলেকট্রন</b>: বিটা (β) রশ্মি হলো তেজস্ক্রিয় নিউক্লিয়াস থেকে বের হওয়া ইলেকট্রন।',
    what_m_light: '"রশ্মি" নাম হলেও এটা আলো নয়, কণা।',
    what_m_nucleon: 'নিউট্রনটি প্রোটন হয়ে নিউক্লিয়াসেই থেকে যায়; বেরিয়ে আসে ইলেকট্রন।',

    q_protons: 'একটি বিটা (β) রশ্মি বের হওয়ার পর এই নিউক্লিয়াসে প্রোটন কয়টি থাকবে?',
    count_n: '{n}টি',
    label_proton_n: 'প্রোটন: {n}টি',
    label_neutron_n: 'নিউট্রন: {n}টি',
    count_why: '<b>{p1}টি</b>: একটি নিউট্রন প্রোটন হয়ে যায় (নিউট্রন <span class="wn-nw">{n0} → {n1}</span>), আর ইলেকট্রনটি বেরিয়ে যায়।',
    count_m_same: 'ইলেকট্রন বের হলে নিউক্লিয়াসও বদলায়।',
    count_m_less: 'কোনো প্রোটন বেরিয়ে যায় না।',
    count_m_n: '{n} ছিল নিউট্রনের সংখ্যা।',

    q_range: 'দুর্বল নিউক্লীয় বল কত দূরত্ব পর্যন্ত কাজ করে?',
    r_any: 'যেকোনো দূরত্ব',
    range_why: '<b>{r}</b>, খুবই অল্প দূরত্ব। {r15} প্রায় প্রোটন-নিউট্রনের মাপ, {r10} পরমাণুর।',
    range_m_any: 'অসীম পাল্লা মহাকর্ষ আর তড়িৎ চৌম্বক বলের।',
    range_m_strong: '{r15} সবল নিউক্লীয় বলের পাল্লা।',

    q_far: 'মহাকর্ষ বল আর দুর্বল নিউক্লীয় বলের মধ্যে কোনটি অনেক দূর থেকেও কাজ করতে পারে?',
    far_gravity: 'মহাকর্ষ বল',
    far_weak: 'দুর্বল নিউক্লীয় বল',
    far_both: 'দুটোই পারে',
    far_none: 'কোনোটিই পারে না',
    far_why: '<b>মহাকর্ষ বল</b>: মহাকর্ষ আর তড়িৎ চৌম্বক বল যেকোনো দূরত্ব থেকে কাজ করতে পারে, কিন্তু দুর্বল নিউক্লীয় বল কাজ করে মাত্র {r} দূরত্বে।',

    q_strong: 'নামে “দুর্বল” হলেও দুর্বল নিউক্লীয় বল কোন বলের চেয়ে অনেক বেশি শক্তিশালী?',
    s_gravity: 'মহাকর্ষ বল',
    s_em: 'তড়িৎ চৌম্বক বল',
    s_strong: 'সবল নিউক্লীয় বল',
    s_none: 'কোনো বলের চেয়েই নয়',
    strong_why: '<b>মহাকর্ষ বল</b>: দুর্বল নিউক্লীয় বল তড়িৎ চৌম্বক বল থেকে প্রায় ট্রিলিয়ন গুণ দুর্বল, কিন্তু মোটেও মহাকর্ষ বলের মতো এত দুর্বল নয়।',
    strong_m_none: 'নাম “দুর্বল” হলেও এটা সবচেয়ে দুর্বল নয়।',

    q_order: 'চারটি মৌলিক বলকে দুর্বল থেকে সবল ক্রমে সাজালে দুর্বল নিউক্লীয় বল কোথায় বসবে?',
    o_between: 'মহাকর্ষ বলের পরে, তড়িৎ চৌম্বক বলের আগে',
    o_first: 'সবার আগে, মহাকর্ষ বলেরও আগে',
    o_last: 'সবার শেষে, সবল নিউক্লীয় বলেরও পরে',
    o_third: 'তড়িৎ চৌম্বক বলের পরে, সবল নিউক্লীয় বলের আগে',
    order_why: '<b>মহাকর্ষ বলের পরে, তড়িৎ চৌম্বক বলের আগে</b>: দুর্বল থেকে সবল ক্রমে মহাকর্ষ, দুর্বল নিউক্লীয়, তড়িৎ চৌম্বক, সবল নিউক্লীয় বল।',

    q_times: 'একটি নিউট্রনের মাপ প্রায় {r15}। দুর্বল নিউক্লীয় বলের পাল্লা এর চেয়ে কত গুণ ছোট?',
    times_n: '{n} গুণ',
    times_lakh: '{n} লক্ষ গুণ',
    times_why: '<b>{k} গুণ</b>: {r15} থেকে {r} তিন ধাপ, প্রতি ধাপে {ten} গুণ ছোট ({ten} × {ten} × {ten} = {k})। নিউট্রন একটি ফুটবল হলে পাল্লাটি একটি বালুকণা।',
  },
  en: {
    title: 'Weak nuclear force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Nucleus',

    stops_label: 'What to look at',
    stop_atom: 'Atom',
    stop_nucleus: 'Nucleus',
    stop_reach: 'Weak force range',
    stop_reach_short: 'Range',
    act_beta: 'Show the β ray',
    act_again: 'Show again',

    idea_nucleus:
      'The <b class="c-e">beta (β) ray, or electron,</b> that comes out of a radioactive nucleus is caused by the <b class="c-weak">weak nuclear force</b>. Tap the nucleus to see it.',
    idea_change: 'Inside the nucleus the <b class="c-weak">weak nuclear force</b> is acting: a neutron is changing…',
    idea_done:
      'Because of the <b class="c-weak">weak nuclear force</b> a neutron became a proton (protons <b class="c-p wn-nw">{p0} → {p1}</b>, neutrons <b class="c-n wn-nw">{n0} → {n1}</b>), and an <b class="c-e">electron</b> came out: that is the beta (β) ray.',
    idea_atom:
      'An atom is about {atom} across. The electromagnetic force pulls the electrons and acts from any distance; but the range of the <b class="c-weak">weak nuclear force</b> is a hundred millionth of this ({r}).',
    idea_reach:
      'The <b class="c-weak">weak nuclear force</b> acts only up to {r}; outside this sphere it does not act. If a neutron were the size of a football, this range would be like a grain of sand.',

    forces_title: 'The four fundamental forces (weakest → strongest)',
    f_gravity: 'Gravity',
    f_weak: 'Weak nuclear',
    f_em: 'Electro\u00admagnetic', // may break as Electro-|magnetic in a narrow box
    f_strong: 'Strong nuclear',
    range_inf: 'range infinite',
    range_is: 'range {r}',
    strength_book:
      'The <b class="c-weak">weak nuclear force</b> is weaker than the electromagnetic force (about a trillion times), but not at all as weak as gravity.',

    label_proton: 'Proton',
    label_neutron: 'Neutron',
    label_weak: 'Weak nuclear force',
    label_weak_2: 'Weak<br>nuclear force',
    label_beta: 'Beta (β) ray, an electron',
    label_beta_2: 'Beta (β) ray,<br>an electron',
    label_beta_q: 'Beta (β) ray = ?',
    label_new: 'Neutron → proton',
    label_new_2: 'Neutron<br>→ proton',
    label_electron: 'Electron',
    label_nucleus: 'Nucleus',
    label_reach: 'Range of the weak nuclear force',
    label_reach_2: 'Range of the<br>weak nuclear force',
    label_atom_size: 'Atom: about {s}',
    label_unknown: '?',
    note_base: 'Symbolic picture',
    note_slow: 'Symbolic picture; time slowed down a great deal',
    note_atom: 'Symbolic picture; nucleus and electrons drawn much bigger',
    note_reach: 'Inside a neutron (symbolic picture)',
    scale_label: 'Scale',
    scale_of_neutron: 'one {n}th of a neutron',

    coach_tap: 'Tap the nucleus',
    coach_lens: 'Drag here to move the magnifier',
    hint_wait: 'Wait a moment: the last one is still going.',

    q_count: 'Question {i} / {n}',
    q_score: 'Right: {right}',
    q_hint: 'Look at the picture, think, and pick the right answer.',
    q_right: 'Right!',
    q_wrong: 'Not quite. The answer is',
    q_next: 'Next question',
    q_finish: 'See the result',
    q_result: '{right} of {total} right',
    q_great: 'Excellent! All right.',
    q_good: 'Well done!',
    q_try: 'Try once more.',
    q_again: 'Take the test again',
    q_locked: 'The picture stays as it is during the test. Read the question and pick an answer.',

    q_cause: 'Which force made this beta (β) ray come out of the nucleus?',
    c_weak: 'Weak nuclear force',
    c_strong: 'Strong nuclear force',
    c_em: 'Electromagnetic force',
    c_gravity: 'Gravity',
    cause_why: '<b>The weak nuclear force</b>: it is why the beta (β) ray, or electron, comes out.',
    cause_answer: '<b>The weak nuclear force</b>.',
    cause_m_strong: 'The strong nuclear force holds the nucleus together; the beta (β) ray comes from the weak nuclear force.',
    cause_m_em: 'The electron has a charge, so it may look electromagnetic, but what turns the neutron into a proton is the weak nuclear force.',
    cause_m_gravity: 'Between such tiny particles gravity is extremely weak; the beta (β) ray comes from the weak nuclear force.',

    q_what: 'What is the beta (β) ray that comes out of the nucleus?',
    w_electron: 'An electron',
    w_proton: 'A proton',
    w_neutron: 'A neutron',
    w_light: 'Light',
    what_why: '<b>An electron</b>: the beta (β) ray is an electron that comes out of a radioactive nucleus.',
    what_m_light: 'It is called a "ray", but it is not light: it is a particle.',
    what_m_nucleon: 'The neutron becomes a proton and stays in the nucleus; an electron comes out.',

    q_protons: 'After one beta (β) ray comes out, how many protons will this nucleus have?',
    count_n: '{n}',
    label_proton_n: 'Protons: {n}',
    label_neutron_n: 'Neutrons: {n}',
    count_why: '<b>{p1}</b>: a neutron becomes a proton (neutrons <span class="wn-nw">{n0} → {n1}</span>), and the electron leaves.',
    count_m_same: 'When the electron comes out, the nucleus changes too.',
    count_m_less: 'No proton leaves.',
    count_m_n: '{n} was the number of neutrons.',

    q_range: 'Up to what distance does the weak nuclear force act?',
    r_any: 'Any distance',
    range_why: '<b>{r}</b>, a very small distance. {r15} is about the size of a proton or neutron, {r10} of an atom.',
    range_m_any: 'Gravity and the electromagnetic force have infinite range.',
    range_m_strong: '{r15} is the range of the strong nuclear force.',

    q_far: 'Of gravity and the weak nuclear force, which can act from very far away?',
    far_gravity: 'Gravity',
    far_weak: 'The weak nuclear force',
    far_both: 'Both can',
    far_none: 'Neither can',
    far_why: '<b>Gravity</b>: gravity and the electromagnetic force can act from any distance, but the weak nuclear force acts only up to {r}.',

    q_strong: 'It is called “weak”, but which force is the weak nuclear force much stronger than?',
    s_gravity: 'Gravity',
    s_em: 'Electromagnetic force',
    s_strong: 'Strong nuclear force',
    s_none: 'None of them',
    strong_why:
      '<b>Gravity</b>: the weak nuclear force is about a trillion times weaker than the electromagnetic force, but not at all as weak as gravity.',
    strong_m_none: 'It is called “weak”, but it is not the weakest.',

    q_order: 'If the four fundamental forces are put in order from weakest to strongest, where does the weak nuclear force go?',
    o_between: 'After gravity, before the electromagnetic force',
    o_first: 'First of all, before gravity',
    o_last: 'Last of all, after the strong force',
    o_third: 'After the electromagnetic force, before the strong force',
    order_why:
      '<b>After gravity, before the electromagnetic force</b>: from weakest to strongest, gravity, weak nuclear, electromagnetic, strong nuclear.',

    q_times: 'A neutron is about {r15} across. How many times smaller is the range of the weak nuclear force?',
    times_n: '{n} times',
    times_lakh: '{n} lakh times',
    times_why:
      '<b>{k} times</b>: from {r15} to {r} is three steps, each {ten} times smaller ({ten} × {ten} × {ten} = {k}). If a neutron were a football, the range would be a grain of sand.',
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
