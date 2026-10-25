// Every string the strong nuclear force figure shows, in Bangla (the book's words, page 69, 3.2.4: সবল নিউক্লীয়
// বল, সৃষ্টিজগতের সবচেয়ে শক্তিশালী বল, নিউক্লিয়াস, প্রোটন, নিউট্রন, শক্তি, ভেঙে, জোড়া দিয়ে, ইলেকট্রো উইক) and
// English. Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).
// {p} in a string is the range, "10⁻¹⁵ m", put in as HTML with a raised power (see pow() in app.js).

export const STRINGS = {
  bn: {
    title: 'সবল নিউক্লীয় বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'দূরত্ব',
    unit_m: 'm',
    times: 'গুণ',

    scenes: 'কী দেখবে',
    scene_pull: 'প্রোটন টানো',
    scene_split: 'ভাঙা',
    scene_join: 'জোড়া দেওয়া',
    act_again: 'আবার',
    act_again_long: 'আবার শুরু করো',
    distance: 'দূরত্ব',

    legend_proton: 'প্রোটন',
    legend_neutron: 'নিউট্রন',
    note_symbolic: 'ছবি প্রতীকী: আকার ও তীর মাপমতো নয়',
    note_slow: 'ছবি প্রতীকী: সময় অনেক ধীর করে দেখানো',

    label_strong: 'সবল নিউক্লীয় বল',
    label_electric: 'তড়িৎ বিকর্ষণ',
    label_neutron: 'নিউট্রন',
    label_big: 'বড় নিউক্লিয়াস',
    label_small: 'ছোট নিউক্লিয়াস',
    label_new: 'নতুন নিউক্লিয়াস',
    label_energy: 'শক্তি',

    eq_big: 'বড় নিউক্লিয়াস',
    eq_two_small: 'দুটি ছোট নিউক্লিয়াস',
    eq_one: 'একটি নিউক্লিয়াস',
    eq_energy: 'শক্তি',

    // the pull scene: one line for each thing that can happen
    say_idle: 'সবল নিউক্লীয় বল সৃষ্টিজগতের সবচেয়ে শক্তিশালী বল, কিন্তু কাজ করে খুবই অল্প দূরত্বে ({p}, স্কেলের কমলা অংশ)। ডানের প্রোটনটি টেনে বের করো।',
    say_in: 'সবল নিউক্লীয় বল প্রোটনটিকে প্রচণ্ড জোরে পেছনে টানছে; অন্য প্রোটনগুলোর তড়িৎ বিকর্ষণ তার তুলনায় খুবই ছোট। ছেড়ে দিলে ফিরে যাবে।',
    say_out: '{p}-এর চেয়ে দূরে সবল নিউক্লীয় বল কাজ করে না; শুধু অন্য প্রোটনগুলোর তড়িৎ বিকর্ষণ ঠেলছে। ছেড়ে দিলে দূরে চলে যাবে।',
    say_back: 'ফিরে এসে আবার আটকে গেল: অল্প দূরত্বে সবল নিউক্লীয় বল তড়িৎ চৌম্বক বল থেকেও একশ গুণ বেশি শক্তিশালী।',
    say_away: 'পাল্লার বাইরে সবল নিউক্লীয় বল নেই, তাই অন্য প্রোটনগুলোর তড়িৎ বিকর্ষণ একে দূরে ঠেলে দিল।',
    // energy
    say_split_go: 'একটি নিউট্রন বড় নিউক্লিয়াসে (যেমন ইউরেনিয়াম) ঢুকলে নিউক্লিয়াসটি কেঁপে উঠে দুই ভাগ হয়ে যায়…',
    say_split_done: 'প্রচণ্ড বলে আটকে থাকায় নিউক্লিয়াসে অনেক শক্তি জমা থাকে; বড় নিউক্লিয়াস ভাঙলে তা বেরিয়ে আসে। পারমাণবিক বিদ্যুৎকেন্দ্রে (যেমন রূপপুর) এভাবে শক্তি পাওয়া যায়।',
    say_join_go: 'দুটি ছোট নিউক্লিয়াস প্রচণ্ড বেগে ছুটে আসছে; {p}-এর মধ্যে এলেই সবল নিউক্লীয় বল এদের ধরে ফেলবে…',
    say_join_done: 'ছোট নিউক্লিয়াস জোড়া দিলেও অনেক শক্তি বের হয়। সূর্যের ভেতরেও হাইড্রোজেনের নিউক্লিয়াস জোড়া লেগে হিলিয়াম হয়; সেই শক্তিই সূর্যের আলো আর তাপ।',

    // the four fundamental forces, weakest first
    forces_title: 'চার মৌলিক বল (দুর্বল থেকে সবল)',
    f_grav: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',
    f_ew: 'ইলেকট্রো উইক',
    forces_aria: 'চার মৌলিক বল, দুর্বল থেকে সবল: মহাকর্ষ, দুর্বল নিউক্লীয়, তড়িৎ চৌম্বক, সবল নিউক্লীয়। দুর্বল নিউক্লীয় আর তড়িৎ চৌম্বক মিলে ইলেকট্রো উইক।',

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

    q_hold: 'প্রোটনগুলো একে অপরকে বিকর্ষণ করে; তবু কোন বল প্রোটন আর নিউট্রনকে আটকে রাখে?',
    opt_strong: 'সবল নিউক্লীয় বল',
    opt_weak: 'দুর্বল নিউক্লীয় বল',
    opt_em: 'তড়িৎ চৌম্বক বল',
    opt_grav: 'মহাকর্ষ বল',
    why_hold: '<b>সবল নিউক্লীয় বল</b>: নিউক্লিয়াসের ভেতরে এই প্রচণ্ড শক্তিশালী বলই প্রোটন আর নিউট্রনকে আটকে রাখে।',
    why_hold_weak: 'দুর্বল নিউক্লীয় বল বিটা রশ্মি বের হওয়ার কারণ।',
    why_hold_em: 'তড়িৎ বল বরং প্রোটনগুলোকে ঠেলে সরায়।',
    why_hold_grav: 'এত ছোট ভরে মহাকর্ষ বল খুবই দুর্বল।',

    q_release: 'প্রোটনটি নিউক্লিয়াস থেকে {d} দূরে ধরে রাখা আছে। ছেড়ে দিলে কী হবে?',
    opt_back: 'ফিরে এসে আটকাবে',
    opt_away: 'দূরে সরে যাবে',
    opt_stay: 'যেখানে আছে থাকবে',
    opt_break: 'নিউক্লিয়াস ভাঙবে',
    why_release_in: '<b>ফিরে আসবে</b>: {d} এখনো {p}-এর মধ্যে, তাই সবল নিউক্লীয় বল টানছে; তা বিকর্ষণের চেয়ে অনেক বড়।',
    why_release_out: '<b>দূরে সরে যাবে</b>: {d} দূরে সবল নিউক্লীয় বল পৌঁছায় না (পাল্লা প্রায় {p}); শুধু বিকর্ষণ ঠেলে।',
    why_release_stay: 'একটি বল কাজ করছে, তাই থেমে থাকবে না।',
    why_release_break: 'একটি প্রোটনের জন্য পুরো নিউক্লিয়াস ভাঙে না।',

    q_strength: 'বই অনুযায়ী সবল নিউক্লীয় বল মহাকর্ষ বলের তুলনায় কত গুণ শক্তিশালী?',
    why_strength: '<b>{x} গুণ</b>: বই বলছে, এটি তড়িৎ চৌম্বক বল থেকেও একশ গুণ বেশি শক্তিশালী।',
    why_strength_36: '{x} গুণ হলো মহাকর্ষের তুলনায় তড়িৎ চৌম্বক বল।',
    why_strength_100: 'একশ গুণ হলো তড়িৎ চৌম্বক বলের সাথে তুলনা।',
    why_strength_15: '{p} হলো এর পাল্লা, শক্তির তুলনা নয়।',

    q_range: 'সবল নিউক্লীয় বল প্রায় কত দূরত্ব পর্যন্ত কাজ করে?',
    opt_infinite: 'অসীম দূরত্ব',
    why_range: '<b>প্রায় {p}</b>: এর চেয়ে দূরে এটি কাজ করে না, তাই শুধু পাশাপাশি থাকা প্রোটন আর নিউট্রনকে আটকে রাখে।',
    why_range_18: '{x} হলো দুর্বল নিউক্লীয় বলের পাল্লা।',
    why_range_inf: 'মহাকর্ষ আর তড়িৎ চৌম্বক বলের পাল্লা অসীম।',
    why_range_big: '{x} বিশাল দূরত্ব: সূচকটি ঋণাত্মক হবে।',

    q_energy_big: 'ছবিতে একটি বড় নিউক্লিয়াস। এর জমা শক্তি বের করার উপায় কোনটি?',
    q_energy_small: 'ছবিতে দুটি ছোট নিউক্লিয়াস। এদের থেকে অনেক শক্তি পাওয়ার উপায় কোনটি?',
    opt_split: 'ভেঙে দুই ভাগ করে',
    opt_join: 'জোড়া দিয়ে এক করে',
    opt_burn: 'আগুনে পুড়িয়ে',
    opt_current: 'বিদ্যুৎ চালিয়ে',
    why_energy_big: '<b>ভেঙে দুই ভাগ করে</b>: বড় নিউক্লিয়াস ভাঙলে জমে থাকা শক্তির কিছুটা বেরিয়ে আসে।',
    why_energy_small: '<b>জোড়া দিয়ে এক করে</b>: ছোট নিউক্লিয়াস জোড়া লাগলে অনেক শক্তি বের হয়, যেমন সূর্যের ভেতরে।',
    why_energy_mixed: 'ভাঙা কাজে লাগে বড় নিউক্লিয়াসে, জোড়া দেওয়া ছোট নিউক্লিয়াসে।',
    why_energy_burn: 'পোড়ানো রাসায়নিক বিক্রিয়া, তাতে নিউক্লিয়াস বদলায় না।',
    why_energy_current: 'বিদ্যুৎ চালালে নিউক্লিয়াস ভাঙে না, জোড়াও লাগে না।',

    q_group: 'বলকে তিন ধরনের বললে দুর্বল নিউক্লীয় বল কোন ধরনে পড়ে?',
    opt_ew: 'ইলেকট্রো উইক',
    opt_nuclear: 'নিউক্লিয়ার বল',
    opt_none: 'কোনোটিতেই নয়',
    why_group: '<b>ইলেকট্রো উইক</b>: তড়িৎ চৌম্বক আর দুর্বল নিউক্লীয় বলকে একই সূত্র দিয়ে ব্যাখ্যা করা গেছে।',
    why_group_nuclear: 'নামে ‘নিউক্লীয়’ থাকলেও এটি ইলেকট্রো উইকের অংশ।',
    why_group_grav: 'মহাকর্ষকে এখনো অন্যগুলোর সাথে এক সূত্রে গাঁথা যায়নি।',
    why_group_none: 'এটি বাদ পড়েনি, তড়িৎ চৌম্বক বলের সাথে মিলে গেছে।',
  },
  en: {
    title: 'Strong nuclear force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Distance',
    unit_m: 'm',
    times: 'times',

    scenes: 'What to see',
    scene_pull: 'Pull a proton',
    scene_split: 'Split',
    scene_join: 'Join',
    act_again: 'Again',
    act_again_long: 'Start again',
    distance: 'Distance',

    legend_proton: 'Proton',
    legend_neutron: 'Neutron',
    note_symbolic: 'Symbolic: sizes and arrows not to scale',
    note_slow: 'Symbolic: shown very much slowed down',

    label_strong: 'Strong nuclear force',
    label_electric: 'Electric repulsion',
    label_neutron: 'Neutron',
    label_big: 'Big nucleus',
    label_small: 'Small nucleus',
    label_new: 'New nucleus',
    label_energy: 'Energy',

    eq_big: 'Big nucleus',
    eq_two_small: 'Two small nuclei',
    eq_one: 'One nucleus',
    eq_energy: 'energy',

    say_idle:
      'The strong nuclear force is the strongest force in the universe, but it acts only over a very short distance ({p}, the orange part of the scale). Pull out the proton on the right.',
    say_in:
      'The strong nuclear force pulls the proton back very hard; the electric repulsion of the other protons is tiny next to it. Let go and it comes back.',
    say_out:
      'Farther than {p}, the strong nuclear force does not act; only the electric repulsion of the other protons pushes. Let go and it flies away.',
    say_back: 'It came back and stuck: at short distances the strong nuclear force is a hundred times stronger even than the electromagnetic force.',
    say_away: 'Out of range there is no strong nuclear force, so the electric repulsion of the other protons pushed it away.',
    say_split_go: 'A neutron enters a big nucleus (such as uranium); the nucleus wobbles and splits in two…',
    say_split_done:
      'Held by a huge force, a nucleus stores a lot of energy; when a big nucleus splits, it comes out. Nuclear power plants (such as Rooppur) get their energy this way.',
    say_join_go: 'Two small nuclei rush together very fast; as soon as they are within {p}, the strong nuclear force will grab them…',
    say_join_done:
      'Joining small nuclei also gives a lot of energy. Inside the Sun, too, hydrogen nuclei join into helium; that energy is the Sun’s light and heat.',

    forces_title: 'Four fundamental forces (weakest to strongest)',
    f_grav: 'Gravity',
    f_weak: 'Weak nuclear',
    f_em: 'Electromagnetic',
    f_strong: 'Strong nuclear',
    f_ew: 'Electro-weak',
    forces_aria:
      'Four fundamental forces, weakest first: gravitational, weak nuclear, electromagnetic, strong nuclear. Weak nuclear and electromagnetic together are electro-weak.',

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

    q_hold: 'Protons repel each other; so which force holds the protons and neutrons together?',
    opt_strong: 'Strong nuclear force',
    opt_weak: 'Weak nuclear force',
    opt_em: 'Electromagnetic force',
    opt_grav: 'Gravitational force',
    why_hold: '<b>The strong nuclear force</b>: inside the nucleus this very strong force acts between protons and neutrons and holds them together.',
    why_hold_weak: 'The weak nuclear force causes beta rays; it does not hold the nucleus together.',
    why_hold_em: 'The electromagnetic force rather pushes the protons apart.',
    why_hold_grav: 'With such tiny masses gravity is extremely weak.',

    q_release: 'The proton is held {d} from the nucleus. What happens if it is let go?',
    opt_back: 'It comes back',
    opt_away: 'It moves away',
    opt_stay: 'It stays where it is',
    opt_break: 'The nucleus breaks',
    why_release_in: '<b>It comes back</b>: {d} is within {p}, so the strong nuclear force still pulls, much harder than the electric repulsion.',
    why_release_out: '<b>It moves away</b>: at {d} the strong nuclear force does not reach (range about {p}); only the electric repulsion pushes.',
    why_release_stay: 'A force acts on it, so it will not stay still.',
    why_release_break: 'One proton does not break the whole nucleus.',

    q_strength: 'According to the book, how many times stronger than gravity is the strong nuclear force?',
    why_strength:
      '<b>{x} times</b>: it is the strongest force in the universe; the book says it is a hundred times stronger even than the electromagnetic force.',
    why_strength_36: '{x} times compares the electromagnetic force with gravity.',
    why_strength_100: 'A hundred times is the comparison with the electromagnetic force.',
    why_strength_15: '{p} is its range, not a comparison of strength.',

    q_range: 'About how far does the strong nuclear force reach?',
    opt_infinite: 'Infinitely far',
    why_range: '<b>About {p}</b>: beyond that it does not act, so it holds only neighbouring protons and neutrons inside the nucleus.',
    why_range_18: '{x} is the range of the weak nuclear force.',
    why_range_inf: 'Gravity and the electromagnetic force have infinite range.',
    why_range_big: '{x} is a huge distance: the power must be negative.',

    q_energy_big: 'The picture shows a big nucleus. How can the energy stored in it be released?',
    q_energy_small: 'The picture shows two small nuclei. How can a lot of energy be got from them?',
    opt_split: 'By splitting it in two',
    opt_join: 'By joining them into one',
    opt_burn: 'By burning',
    opt_current: 'By passing a current',
    why_energy_big: '<b>By splitting it in two</b>: when a big nucleus splits, part of the energy held by the huge force comes out.',
    why_energy_small: '<b>By joining them into one</b>: when small nuclei join, a lot of energy comes out, as inside the Sun.',
    why_energy_mixed: 'Splitting works for big nuclei, joining for small ones.',
    why_energy_burn: 'Burning is a chemical reaction; it does not change the nucleus.',
    why_energy_current: 'A current neither splits nor joins nuclei.',

    q_group: 'If forces are said to be of three kinds, which kind is the weak nuclear force?',
    opt_ew: 'Electro-weak',
    opt_nuclear: 'Nuclear force',
    opt_none: 'None of them',
    why_group:
      '<b>Electro-weak</b>: the electromagnetic and weak nuclear forces are explained by one theory; together they are the electro-weak force.',
    why_group_nuclear: 'It has "nuclear" in its name, but it is part of the electro-weak force.',
    why_group_grav: 'Gravity has not yet been joined with the others in one theory.',
    why_group_none: 'It was not left out; it joined with the electromagnetic force.',
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
