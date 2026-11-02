// Every string the strong nuclear force figure shows, in Bangla (the book's words, page 69, 3.2.4: সবল নিউক্লীয়
// বল, সৃষ্টিজগতের সবচেয়ে শক্তিশালী বল, নিউক্লিয়াস, প্রোটন, নিউট্রন, শক্তি, ভেঙে, জোড়া দিয়ে, ইলেকট্রো উইক,
// নিউক্লিয়ার বল) and English. Use t('key') in code, and t.num() for numbers (Bangla digits when the language is
// Bangla). {p} in a string is the range, "10⁻¹⁵ m", and {d} a distance, put in as HTML with a raised power.

export const STRINGS = {
  bn: {
    panel_hide: 'লেখা লুকাও',
    panel_show: 'লেখা দেখাও',
    rotate_title: 'ফোনটি আড়াআড়ি ধরো',
    rotate_body: 'পাশে ঘোরালে ছবি বড় হয়, লেখা থাকে পাশে।',
    rotate_go: 'ঘুরিয়ে দেখো',
    rotate_stay: 'এভাবেই দেখো',
    title: 'সবল নিউক্লীয় বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'দূরত্ব',
    unit_m: 'm',

    act_again: 'আবার',
    act_again_long: 'আবার শুরু করো',
    distance: 'দূরত্ব',

    legend_proton: 'প্রোটন',
    legend_neutron: 'নিউট্রন',
    note_pull: 'ছবি প্রতীকী: তীরের দৈর্ঘ্য মাপমতো নয়',
    note_slow: 'ছবি প্রতীকী: সময় অনেক ধীর করে দেখানো',

    label_strong: 'সবল নিউক্লীয় বল',
    label_electric: 'তড়িৎ বিকর্ষণ',
    label_reach: 'সবল বলের পাল্লা',

    // the pull scene: one line for each thing that can happen
    say_idle: 'সবল নিউক্লীয় বল সৃষ্টিজগতের সবচেয়ে শক্তিশালী বল, কিন্তু কাজ করে খুবই অল্প দূরত্বে: প্রায় {p} পর্যন্ত (কমলা দাগ)। প্রোটনটি টেনে বের করো।',
    say_in: 'পাশের প্রোটন ও নিউট্রনগুলো সবল নিউক্লীয় বল দিয়ে একে প্রচণ্ড জোরে ভেতরে টানছে; তড়িৎ বিকর্ষণ তার কাছে খুব ছোট। ছেড়ে দিলে ফিরে যাবে।',
    say_edge: 'কমলা দাগের কাছে, প্রায় {p} দূরে, সবল নিউক্লীয় বল দ্রুত কমে যাচ্ছে, তবু এখনো তড়িৎ বিকর্ষণের চেয়ে বড়। ছেড়ে দিলে ফিরে যাবে।',
    say_out: 'কমলা দাগের বাইরে (প্রায় {p}-এর বেশি দূরে) সবল নিউক্লীয় বল কাজ করে না; শুধু তড়িৎ বিকর্ষণ ঠেলছে। ছেড়ে দিলে দূরে চলে যাবে।',
    say_back: 'ফিরে এসে আবার আটকে গেল: অল্প দূরত্বে সবল নিউক্লীয় বল তড়িৎ চৌম্বক বল থেকেও একশ গুণ বেশি শক্তিশালী।',
    say_away: 'পাল্লার বাইরে সবল নিউক্লীয় বল নেই, তাই অন্য প্রোটনগুলোর তড়িৎ বিকর্ষণ একে দূরে ঠেলে দিল।',
    // energy

    // the four fundamental forces, weakest first, and the book's three kinds under them
    forces_title: 'চার মৌলিক বল (দুর্বল → শক্তিশালী)',
    f_grav: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',
    k_grav: 'মহাকর্ষ',
    f_ew: 'ইলেকট্রো উইক',
    f_nuclear: 'নিউক্লিয়ার বল',
    forces_aria:
      'চার মৌলিক বল, সবচেয়ে দুর্বল থেকে সবচেয়ে শক্তিশালী: মহাকর্ষ, দুর্বল নিউক্লীয়, তড়িৎ চৌম্বক, সবল নিউক্লীয়। দুর্বল নিউক্লীয় আর তড়িৎ চৌম্বক মিলে ইলেকট্রো উইক, তাই বল তিন ধরনের: মহাকর্ষ, ইলেকট্রো উইক এবং নিউক্লিয়ার বল।',

    coach_pull: 'টেনে বের করো',
    coach_lens: 'বিবর্ধক সরাতে এখানে ধরে টানো',

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
    q_locked: 'পরীক্ষার সময় ছবি আটকানো থাকে। ভেবে উত্তর বেছে নাও।',

    q_who: 'সবল নিউক্লীয় বল কোন কণাগুলোর মধ্যে কাজ করে?',
    opt_who_all: 'প্রোটন ও নিউট্রন সবার মধ্যে',
    opt_who_ep: 'ইলেকট্রন ও প্রোটনের মধ্যে',
    opt_who_p: 'শুধু প্রোটনদের মধ্যে',
    opt_who_n: 'শুধু নিউট্রনদের মধ্যে',
    why_who: '<b>প্রোটন ও নিউট্রন সবার মধ্যে</b>: নিউক্লিয়াসের প্রোটন এবং নিউট্রনের নিজেদের মাঝে এই বল কাজ করে।',
    why_who_ep: 'ইলেকট্রন থাকে নিউক্লিয়াসের বাইরে, অনেক দূরে।',
    why_who_p: 'নিউট্রনও এই বলে টানে, টান খায়।',
    why_who_n: 'প্রোটনও এই বলে টানে, শুধু নিউট্রন নয়।',

    q_release: 'প্রোটনটি নিউক্লিয়াস থেকে {d} দূরে ধরে রাখা আছে। ছেড়ে দিলে কী হবে?',
    opt_back: 'ফিরে এসে আটকাবে',
    opt_away: 'দূরে সরে যাবে',
    opt_stay: 'যেখানে আছে থাকবে',
    opt_break: 'নিউক্লিয়াস ভাঙবে',
    why_release_in: '<b>ফিরে এসে আটকাবে</b>: {d} পাল্লার (প্রায় {p}) ভেতরে, তাই সবল নিউক্লীয় বলের টান বিকর্ষণের চেয়ে অনেক বড়।',
    why_release_out: '<b>দূরে সরে যাবে</b>: {d} দূরে সবল নিউক্লীয় বল পৌঁছায় না (পাল্লা প্রায় {p}); শুধু বিকর্ষণ ঠেলে।',
    why_release_stay: 'একটি বল কাজ করছে, তাই থামবে না।',
    why_release_break: 'একটি প্রোটনের জন্য পুরো নিউক্লিয়াস ভাঙে না।',

    q_atom: 'দুটি প্রোটন {d} দূরে (মোটামুটি একটি পরমাণুর মাপ)। এদের মধ্যে কোন বলটি বড়?',
    opt_atom_em: 'তড়িৎ বিকর্ষণ',
    opt_atom_strong: 'সবল নিউক্লীয় বল',
    opt_atom_equal: 'দুটিই সমান',
    opt_atom_none: 'কোনো বলই নেই',
    why_atom: '<b>তড়িৎ বিকর্ষণ</b>: {d} সবল বলের পাল্লার (প্রায় {p}) এক লক্ষ গুণ; এত দূরে সবল নিউক্লীয় বল কাজ করে না।',
    why_atom_strong: 'সবচেয়ে শক্তিশালী হলেও এত দূরে এটি পৌঁছায় না।',
    why_atom_equal: 'এখানে সবল বল শূন্য, তাই সমান নয়।',
    why_atom_none: 'আধান থাকায় তড়িৎ বিকর্ষণ দূর থেকেও কাজ করে।',

    q_group: 'বলকে তিন ধরনের বললে দুর্বল নিউক্লীয় বল কোন ধরনে পড়ে?',
    opt_ew: 'ইলেকট্রো উইক',
    opt_nuclear: 'নিউক্লিয়ার বল',
    opt_grav: 'মহাকর্ষ বল',
    opt_none: 'কোনোটিতেই নয়',
    why_group: '<b>ইলেকট্রো উইক</b>: তড়িৎ চৌম্বক আর দুর্বল নিউক্লীয় বলকে একই সূত্র দিয়ে ব্যাখ্যা করা গেছে।',
    why_group_nuclear: 'নামে ‘নিউক্লীয়’ থাকলেও এটি ইলেকট্রো উইকের অংশ।',
    why_group_grav: 'মহাকর্ষকে এখনো অন্যগুলোর সাথে এক সূত্রে গাঁথা যায়নি।',
    why_group_none: 'এটি বাদ পড়েনি, তড়িৎ চৌম্বক বলের সাথে মিলে গেছে।',
  },
  en: {
    panel_hide: 'Hide the text',
    panel_show: 'Show the text',
    rotate_title: 'Turn your phone sideways',
    rotate_body: 'Sideways, the picture is bigger and the text sits beside it.',
    rotate_go: 'Turn it',
    rotate_stay: 'Stay like this',
    title: 'Strong nuclear force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Distance',
    unit_m: 'm',

    act_again: 'Again',
    act_again_long: 'Start again',
    distance: 'Distance',

    legend_proton: 'Proton',
    legend_neutron: 'Neutron',
    note_pull: 'Symbolic: arrows not to scale',
    note_slow: 'Symbolic: much slowed down',

    label_strong: 'Strong nuclear force',
    label_electric: 'Electric repulsion',
    label_reach: 'Reach of the strong force',

    say_idle:
      'The strong nuclear force is the strongest force in nature, but it acts only over a very short distance: about {p} (the orange line). Pull the proton out.',
    say_in:
      'Its neighbouring protons and neutrons pull it in very hard with the strong nuclear force; the electric repulsion is tiny next to it. Let go: it comes back.',
    say_edge:
      'Near the orange line, about {p} out, the strong nuclear force falls fast, but it is still bigger than the electric repulsion. Let go: it comes back.',
    say_out:
      'Outside the orange line (farther than about {p}) the strong nuclear force does not act; only the electric repulsion pushes. Let go: it flies away.',
    say_back: 'It came back and stuck: at short distances the strong nuclear force is a hundred times stronger even than the electromagnetic force.',
    say_away: 'Out of range there is no strong nuclear force, so the electric repulsion of the other protons pushed it away.',

    forces_title: 'Four fundamental forces (weak → strong)',
    f_grav: 'Gravity',
    f_weak: 'Weak nuclear',
    f_em: 'Electromagnetic',
    f_strong: 'Strong nuclear',
    k_grav: 'Gravity',
    f_ew: 'Electro-weak',
    f_nuclear: 'Nuclear force',
    forces_aria:
      'Four fundamental forces, weakest first: gravitational, weak nuclear, electromagnetic, strong nuclear. Weak nuclear and electromagnetic together are electro-weak, so forces are of three kinds: gravitational, electro-weak and nuclear.',

    coach_pull: 'Pull it out',
    coach_lens: 'Drag here to move the magnifier',

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
    q_locked: 'The picture is locked during the test. Think and pick an answer.',

    q_who: 'Between which particles does the strong nuclear force act?',
    opt_who_all: 'All protons and neutrons',
    opt_who_ep: 'Electrons and protons',
    opt_who_p: 'Only between protons',
    opt_who_n: 'Only between neutrons',
    why_who: '<b>All protons and neutrons</b>: it acts between the protons and neutrons of the nucleus.',
    why_who_ep: 'Electrons are far outside the nucleus.',
    why_who_p: 'Neutrons pull and are pulled too.',
    why_who_n: 'Protons pull with it too.',

    q_release: 'The proton is held {d} from the nucleus. What happens if it is let go?',
    opt_back: 'It comes back',
    opt_away: 'It moves away',
    opt_stay: 'It stays where it is',
    opt_break: 'The nucleus breaks',
    why_release_in: '<b>It comes back</b>: {d} is within the strong force’s reach (about {p}).',
    why_release_out: '<b>It moves away</b>: beyond the reach (about {p}) only the repulsion acts.',
    why_release_stay: 'A force acts on it: it cannot stay.',
    why_release_break: 'One proton does not break the nucleus.',

    q_atom: 'Two protons are {d} apart (about the size of an atom). Which force between them is bigger?',
    opt_atom_em: 'Electric repulsion',
    opt_atom_strong: 'Strong nuclear force',
    opt_atom_equal: 'Both the same',
    opt_atom_none: 'No force at all',
    why_atom: '<b>Electric repulsion</b>: the strong force reaches only about {p}, not {d}.',
    why_atom_strong: 'It is the strongest, but not that far.',
    why_atom_equal: 'The strong force is zero here.',
    why_atom_none: 'Charges repel even from far away.',

    q_group: 'If forces are said to be of three kinds, which kind is the weak nuclear force?',
    opt_ew: 'Electro-weak',
    opt_nuclear: 'Nuclear force',
    opt_grav: 'Gravitational force',
    opt_none: 'None of them',
    why_group: '<b>Electro-weak</b>: one theory explains the electromagnetic and weak nuclear forces.',
    why_group_nuclear: 'The name says nuclear, but it is electro-weak.',
    why_group_grav: 'Gravity has not been joined with the others yet.',
    why_group_none: 'It joined with the electromagnetic force.',
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
