// Every string the figure shows, in Bangla (the book's words, page 68, topic 3.2.1: মহাকর্ষ বল, ভর, আকর্ষণ,
// গ্যালাক্সি, নক্ষত্র, সূর্য, পৃথিবী, চাঁদ, মাধ্যাকর্ষণ বল, পৃথিবীর কেন্দ্র, নিচের দিকে, ওজন, পাল্লা, অসীম; this page
// writes ওপর) and English. Use t('key') in code, and t.num() for numbers (Bangla digits when the language is Bangla).

export const STRINGS = {
  bn: {
    title: 'মহাকর্ষ বল',
    view: 'দেখার ধরন',
    view_front_short: 'সামনে',
    view_rotate: 'ঘুরিয়ে দেখো',
    fullscreen: 'পূর্ণ পর্দা',
    tab_learn: 'শেখো',
    tab_quiz: 'পরীক্ষা',
    reading: 'মহাকর্ষ বল',

    stop_label: 'কে কাকে টানে',
    stop_apples: 'আপেল',
    stop_earth: 'পৃথিবী',
    stop_moon: 'চাঁদ',
    stop_sun: 'সূর্য',
    stop_galaxy: 'গ্যালাক্সি',

    idea_apples:
      'ভর আছে সেরকম <b>যেকোনো বস্তু</b> অন্য বস্তুকে <b class="c-g">মহাকর্ষ বল</b> দিয়ে আকর্ষণ করে, টেবিলের দুটি আপেলও। তবে টানটা এত ছোট যে আপেল দুটি নড়ে না।',
    idea_earth:
      'পৃথিবীর মহাকর্ষ বল আমাদের ওপর কাজ করলে তাকে বলে <b class="c-g">মাধ্যাকর্ষণ বল</b>। এটি সবাইকে <b>পৃথিবীর কেন্দ্রের দিকে</b>, অর্থাৎ নিচের দিকে টানে; এর কারণেই আমরা ওজনের অনুভূতি পাই।',
    idea_moon: 'পৃথিবী আর চাঁদ একে অপরকে <b class="c-g">মহাকর্ষ বল</b> দিয়ে আকর্ষণ করে; দুটি তীর সমান। এই টানের কারণেই <b>পৃথিবীকে ঘিরে চাঁদ ঘোরে</b>।',
    idea_sun: 'সূর্য আর পৃথিবী একে অপরকে <b class="c-g">মহাকর্ষ বল</b> দিয়ে আকর্ষণ করে; দুটি তীর সমান। এই টানের কারণেই <b>সূর্যকে ঘিরে পৃথিবী ঘোরে</b>।',
    idea_galaxy:
      '<b class="c-g">মহাকর্ষ বলের</b> কারণে <b>গ্যালাক্সির ভেতরে নক্ষত্ররা ঘুরপাক খায়</b>, আমাদের সূর্যও। এত দূর থেকেও টান কাজ করে: মহাকর্ষ বলের <b>পাল্লা অসীম</b>।',
    idea_nopull_moon: 'কল্পনা করো, পৃথিবীর টান নেই: চাঁদ আর ঘোরে না, যেদিকে চলছিল সেদিকে <b>সরলরেখায়</b> চলে যায় (নিউটনের প্রথম সূত্র)।',
    idea_nopull_sun: 'কল্পনা করো, সূর্যের টান নেই: পৃথিবী আর ঘোরে না, যেদিকে চলছিল সেদিকে <b>সরলরেখায়</b> চলে যায় (নিউটনের প্রথম সূত্র)।',

    fact_apples: 'দূরত্ব {d} সেমি · টান প্রায় <b class="c-g">{f}</b> নিউটন',
    fact_apple_mass: 'প্রতিটি আপেলের ভর {m} গ্রাম।',
    fact_earth: 'তুমি এখন <b>{place}</b> · পৃথিবীর কেন্দ্র থেকে প্রায় {d} কিমি দূরে',
    fact_drop: 'সব আপেল যার যার পায়ের কাছে পড়ল: সবার “নিচে” মানে <b>পৃথিবীর কেন্দ্রের দিকে</b>।',
    fact_moon: 'দূরত্ব প্রায় {d} লক্ষ কিমি · প্রায় {n} দিনে এক পাক',
    fact_sun: 'দূরত্ব প্রায় {d} কোটি কিমি · {n} বছরে এক পাক',
    fact_galaxy: 'কেন্দ্র থেকে প্রায় {d} হাজার আলোকবর্ষ · প্রায় {n} কোটি বছরে এক পাক',
    fact_drag_apple: 'ডানের আপেলটি টেনে দূরে সরাও।',

    place_north_pole: 'উত্তর মেরুতে',
    place_russia: 'রাশিয়ায়',
    place_mongolia: 'মঙ্গোলিয়ায়',
    place_china: 'চীনে',
    place_bhutan_india: 'ভারত ও ভুটানে',
    place_bangladesh: 'বাংলাদেশে',
    place_bay_of_bengal: 'বঙ্গোপসাগরে, নৌকায়',
    place_indian_ocean: 'ভারত মহাসাগরে, নৌকায়',
    place_antarctica: 'অ্যান্টার্কটিকায়',
    place_south_pole: 'দক্ষিণ মেরুতে',
    place_pacific: 'প্রশান্ত মহাসাগরে, নৌকায়',
    place_central_america: 'মধ্য আমেরিকায়',
    place_gulf_of_mexico: 'মেক্সিকো উপসাগরে, নৌকায়',
    place_usa: 'আমেরিকা যুক্তরাষ্ট্রে',
    place_canada: 'কানাডায়',

    act_drop: 'আপেল ছাড়ো',
    act_nopull: 'টান না থাকলে?',
    act_pull_back: 'টান ফিরিয়ে দাও',

    label_you: 'তুমি',
    label_pull_earth: 'মাধ্যাকর্ষণ বল',
    label_centre: 'পৃথিবীর কেন্দ্র',
    label_pull: 'মহাকর্ষ বল',
    label_earth: 'পৃথিবী',
    label_moon: 'চাঁদ',
    label_sun: 'সূর্য',
    label_our_sun: 'আমাদের সূর্য',
    label_galaxy_centre: 'গ্যালাক্সির কেন্দ্র',
    label_dist_apples: '{d} সেমি',
    label_dist_moon: 'প্রায় {d} লক্ষ কিমি',
    label_dist_sun: 'প্রায় {d} কোটি কিমি',
    label_dist_galaxy: 'প্রায় {d} হাজার আলোকবর্ষ',
    label_straight: 'সরলরেখায়',

    note_apples: 'বলের তীর অনেক অনেক গুণ বড় করে আঁকা',
    note_earth: 'মানুষ অনেক বড় করে আঁকা',
    note_space: 'আকার, দূরত্ব, সময় প্রকৃত অনুপাতে নয়',
    note_galaxy: 'সূর্য অনেক বড় করে আঁকা; সময় অনেক দ্রুত',

    forces_title: 'চার মৌলিক বল, দুর্বল থেকে সবল, আর তাদের পাল্লা',
    f_grav: 'মহাকর্ষ',
    f_weak: 'দুর্বল নিউক্লীয়',
    f_em: 'তড়িৎ চৌম্বক',
    f_strong: 'সবল নিউক্লীয়',
    range_inf: 'অসীম',
    range_m: '{p} মি',

    coach_drag: 'টেনে পৃথিবীর চারদিকে ঘোরাও',

    // the test
    q_down_pull: 'এখানে দাঁড়ালে তোমার ওপর মাধ্যাকর্ষণ বল কোন দিকে কাজ করবে?',
    q_down_apple: 'এখানে দাঁড়িয়ে হাতের আপেলটি ছেড়ে দিলে সেটি কোন দিকে পড়বে?',
    dir_aria: 'তীর',
    down_why: '<b>পৃথিবীর কেন্দ্রের দিকে</b>: পৃথিবীর যেখানেই দাঁড়াও, মাধ্যাকর্ষণ বল কেন্দ্রের দিকে টানে।',
    down_mis_screen: 'পর্দার নিচের দিকটা সবার “নিচে” নয়।',
    down_mis_outward: 'টান কেন্দ্র থেকে দূরে নয়, কেন্দ্রের দিকে।',
    down_mis_tangent: 'টান মাটির পাশাপাশি নয়, মাটির ভেতরে কেন্দ্রের দিকে।',

    q_orbit_moon: 'কোন বল চাঁদকে পৃথিবীর চারদিকে ঘুরিয়ে রাখে?',
    q_orbit_sun: 'কোন বল পৃথিবীকে সূর্যের চারদিকে ঘুরিয়ে রাখে?',
    o_earth_g: 'পৃথিবীর মহাকর্ষ বল',
    o_moon_own: 'চাঁদের নিজের মহাকর্ষ বল',
    o_none: 'কোনো বলই লাগে না',
    o_earth_mag: 'পৃথিবীর চৌম্বক বল',
    o_sun_g: 'সূর্যের মহাকর্ষ বল',
    o_earth_own: 'পৃথিবীর নিজের মহাকর্ষ বল',
    o_sun_mag: 'সূর্যের চৌম্বক বল',
    orbit_why_moon: '<b>পৃথিবীর মহাকর্ষ বল</b> চাঁদকে সবসময় পৃথিবীর দিকে টানে; টান না থাকলে চাঁদ সরলরেখায় চলে যেত।',
    orbit_why_sun: '<b>সূর্যের মহাকর্ষ বল</b> পৃথিবীকে সবসময় সূর্যের দিকে টানে; টান না থাকলে পৃথিবী সরলরেখায় চলে যেত।',
    orbit_mis_none: 'বল না থাকলে বস্তু ঘোরে না, সরলরেখায় চলে।',
    orbit_mis_own: 'নিজের টান নিজেকে ঘোরাতে পারে না।',
    orbit_mis_mag: 'চুম্বকের টান নয়, ভরের টান।',

    q_nopull: 'হঠাৎ পৃথিবীর টান না থাকলে চাঁদ কোন পথে চলত?',
    np_straight: 'যেদিকে চলছিল, সেদিকে সোজা',
    np_out: 'পৃথিবী থেকে সোজা দূরে',
    np_round: 'আগের মতোই ঘুরে ঘুরে',
    np_fall: 'পৃথিবীর ওপর পড়ে যেত',
    nopull_why: '<b>যেদিকে চলছিল, সেদিকে সোজা</b>: বল না থাকলে চলন্ত বস্তু সরলরেখায় সমবেগে চলে (নিউটনের প্রথম সূত্র)।',
    np_mis_out: 'কেউ তাকে বাইরে ঠেলে না; সে শুধু সোজা চলতে থাকে।',
    np_mis_round: 'ঘুরতে হলে টান লাগে।',
    np_mis_fall: 'পড়ে যেতেও টান লাগে।',

    q_name: 'নিচের কোনটিকে মাধ্যাকর্ষণ বল বলা হয়?',
    n_earth_apple: 'পৃথিবী আপেলকে যে বলে টানে',
    n_sun_earth: 'সূর্য পৃথিবীকে যে বলে টানে',
    n_two_apples: 'দুটি আপেল পরস্পরকে যে বলে টানে',
    n_magnet: 'চুম্বক লোহাকে যে বলে টানে',
    name_why: '<b>পৃথিবী আপেলকে যে বলে টানে</b>: পৃথিবীর মহাকর্ষ বল আমাদের ও আশপাশের বস্তুর ওপর কাজ করলে তাকে বলে মাধ্যাকর্ষণ বল।',
    name_mis_other: 'এটিও মহাকর্ষ বল, কিন্তু পৃথিবীর টান নয়।',
    name_mis_magnet: 'চুম্বকের টান মহাকর্ষ বলই নয়।',

    q_weight: 'আমরা নিজেদের ওজনের অনুভূতি পাই কেন?',
    w_pull: 'মাধ্যাকর্ষণ বল নিচে টানে বলে',
    w_air: 'বাতাস ওপর থেকে চাপ দেয় বলে',
    w_spin: 'পৃথিবী ঘোরে বলে',
    w_sun: 'সূর্য আমাদের টানে বলে',
    weight_why: '<b>মাধ্যাকর্ষণ বল</b> আমাদের পৃথিবীর কেন্দ্রের দিকে, অর্থাৎ নিচের দিকে টেনে রেখেছে; এর কারণেই ওজনের অনুভূতি।',
    weight_mis: 'ওজন হলো পৃথিবীর টান, অন্য কিছু নয়।',

    q_pairs: 'টেবিলে রাখা দুটি আপেল কি একে অপরকে আকর্ষণ করে?',
    p_yes_weak: 'হ্যাঁ, তবে খুবই সামান্য',
    p_no_big: 'না, শুধু বড় বস্তু টানে',
    p_no_earth: 'না, শুধু পৃথিবী টানে',
    p_yes_move: 'হ্যাঁ, তাই তারা কাছে আসে',
    pairs_why: '<b>হ্যাঁ, তবে খুবই সামান্য</b>: ভর আছে এমন যেকোনো দুটি বস্তু একে অপরকে টানে; এখানে টান মাত্র {f} নিউটন, তাই আপেল নড়ে না।',

    q_range: 'মহাকর্ষ বলের পাল্লা কত?',
    r_air: 'বায়ুমণ্ডল পর্যন্ত',
    r_m: '{p} মিটার',
    range_why: '<b>অসীম</b>: দূরত্ব যত বাড়ে টান তত কমে, কিন্তু কখনো শূন্য হয় না; সূর্য ১৫ কোটি কিমি দূর থেকেও পৃথিবীকে টানে।',
    range_mis_strong: '{p} মিটার সবল নিউক্লীয় বলের পাল্লা।',
    range_mis_weak: '{p} মিটার দুর্বল নিউক্লীয় বলের পাল্লা।',
    range_mis_air: 'মহাকাশেও মহাকর্ষ আছে, নইলে চাঁদ ঘুরত না।',

    q_double: 'দুটি আপেলের দূরত্ব দ্বিগুণ করলে তাদের মধ্যে মহাকর্ষ বল কী হবে?',
    d_less: 'কমবে, তবু কিছুটা থাকবে',
    d_zero: 'শূন্য হয়ে যাবে',
    d_same: 'একই থাকবে',
    d_more: 'বেড়ে যাবে',
    double_why: '<b>কমবে, তবু কিছুটা থাকবে</b>: দূরত্ব দ্বিগুণ হলে টান চার ভাগের এক ভাগ হয় ({a} থেকে {b} নিউটন)। পাল্লা অসীম।',

    q_count: 'প্রশ্ন {i} / {n}',
    q_score: 'সঠিক: {right}',
    q_hint: 'ছবিটি দেখো, ভাবো, তারপর সঠিক উত্তরটি বেছে নাও।',
    q_right: 'ঠিক হয়েছে!',
    q_wrong: 'হয়নি।',
    q_next: 'পরের প্রশ্ন',
    q_finish: 'ফলাফল দেখো',
    q_result: '{total}টির মধ্যে {right}টি সঠিক',
    q_great: 'দারুণ! সবগুলো সঠিক।',
    q_good: 'ভালো হয়েছে!',
    q_try: 'আরেকবার চেষ্টা করো।',
    q_again: 'আবার পরীক্ষা দাও',
    q_locked: 'পরীক্ষার সময় ছবিটি বদলানো যায় না। ছবি দেখে উত্তর বেছে নাও।',
  },
  en: {
    title: 'Gravitational force',
    view: 'View',
    view_front_short: 'Front',
    view_rotate: 'Rotate',
    fullscreen: 'Full screen',
    tab_learn: 'Learn',
    tab_quiz: 'Test',
    reading: 'Gravitational force',

    stop_label: 'Who pulls whom',
    stop_apples: 'Apples',
    stop_earth: 'Earth',
    stop_moon: 'Moon',
    stop_sun: 'Sun',
    stop_galaxy: 'Galaxy',

    idea_apples:
      'Any body that has mass attracts every other body with the <b class="c-g">gravitational force</b>, even two apples on a table. But the pull is so small that the apples do not move.',
    idea_earth:
      'When the Earth’s gravitational force acts on us it is called <b class="c-g">gravity</b>. It pulls everyone <b>towards the Earth’s centre</b>, that is downwards; that is why we feel our weight.',
    idea_moon:
      'The Earth and the Moon attract each other with the <b class="c-g">gravitational force</b>; the two arrows are equal. Because of this pull <b>the Moon goes round the Earth</b>.',
    idea_sun:
      'The Sun and the Earth attract each other with the <b class="c-g">gravitational force</b>; the two arrows are equal. Because of this pull <b>the Earth goes round the Sun</b>.',
    idea_galaxy:
      'Because of the <b class="c-g">gravitational force</b>, <b>stars swirl round inside a galaxy</b>, our Sun too. The pull works over such distances: the <b>range of gravity is infinite</b>.',
    idea_nopull_moon:
      'Imagine the Earth’s pull gone: the Moon stops going round and moves on in a <b>straight line</b> the way it was going (Newton’s first law).',
    idea_nopull_sun:
      'Imagine the Sun’s pull gone: the Earth stops going round and moves on in a <b>straight line</b> the way it was going (Newton’s first law).',

    fact_apples: 'Distance {d} cm · pull about <b class="c-g">{f}</b> N',
    fact_apple_mass: 'Each apple has a mass of {m} g.',
    fact_earth: 'You are <b>{place}</b> · about {d} km from the Earth’s centre',
    fact_drop: 'Every apple fell at its person’s feet: for everyone “down” means <b>towards the Earth’s centre</b>.',
    fact_moon: 'Distance about {d} lakh km · one turn in about {n} days',
    fact_sun: 'Distance about {d} crore km · one turn in {n} year',
    fact_galaxy: 'About {d} thousand light-years from the centre · one turn in about {n} crore years',
    fact_drag_apple: 'Drag the right apple further away.',

    place_north_pole: 'at the North Pole',
    place_russia: 'in Russia',
    place_mongolia: 'in Mongolia',
    place_china: 'in China',
    place_bhutan_india: 'in India and Bhutan',
    place_bangladesh: 'in Bangladesh',
    place_bay_of_bengal: 'on a boat in the Bay of Bengal',
    place_indian_ocean: 'on a boat in the Indian Ocean',
    place_antarctica: 'in Antarctica',
    place_south_pole: 'at the South Pole',
    place_pacific: 'on a boat in the Pacific Ocean',
    place_central_america: 'in Central America',
    place_gulf_of_mexico: 'on a boat in the Gulf of Mexico',
    place_usa: 'in the United States',
    place_canada: 'in Canada',

    act_drop: 'Drop the apples',
    act_nopull: 'What if no pull?',
    act_pull_back: 'Give the pull back',

    label_you: 'You',
    label_pull_earth: 'Gravity',
    label_centre: 'Earth’s centre',
    label_pull: 'Gravitational force',
    label_earth: 'Earth',
    label_moon: 'Moon',
    label_sun: 'Sun',
    label_our_sun: 'Our Sun',
    label_galaxy_centre: 'Centre of the galaxy',
    label_dist_apples: '{d} cm',
    label_dist_moon: 'about {d} lakh km',
    label_dist_sun: 'about {d} crore km',
    label_dist_galaxy: 'about {d} thousand light-years',
    label_straight: 'straight line',

    note_apples: 'Force arrows drawn many, many times bigger',
    note_earth: 'People drawn much bigger',
    note_space: 'Sizes, distances and time not to scale',
    note_galaxy: 'Sun drawn much bigger; time much faster',

    forces_title: 'The four fundamental forces, weakest to strongest, and their range',
    f_grav: 'Gravitational',
    f_weak: 'Weak nuclear',
    f_em: 'Electromagnetic',
    f_strong: 'Strong nuclear',
    range_inf: 'infinite',
    range_m: '{p} m',

    coach_drag: 'Drag round the Earth',

    q_down_pull: 'If you stood here, which way would gravity act on you?',
    q_down_apple: 'If you stood here and let go of the apple, which way would it fall?',
    dir_aria: 'Arrow',
    down_why: '<b>Towards the Earth’s centre</b>: wherever you stand on the Earth, gravity pulls towards the centre.',
    down_mis_screen: 'Down the screen is not everyone’s “down”.',
    down_mis_outward: 'The pull is towards the centre, not away from it.',
    down_mis_tangent: 'The pull is not along the ground but into it, towards the centre.',

    q_orbit_moon: 'Which force keeps the Moon going round the Earth?',
    q_orbit_sun: 'Which force keeps the Earth going round the Sun?',
    o_earth_g: 'The Earth’s gravitational force',
    o_moon_own: 'The Moon’s own gravitational force',
    o_none: 'No force is needed',
    o_earth_mag: 'The Earth’s magnetic force',
    o_sun_g: 'The Sun’s gravitational force',
    o_earth_own: 'The Earth’s own gravitational force',
    o_sun_mag: 'The Sun’s magnetic force',
    orbit_why_moon:
      '<b>The Earth’s gravitational force</b> always pulls the Moon towards the Earth; without it the Moon would move off in a straight line.',
    orbit_why_sun:
      '<b>The Sun’s gravitational force</b> always pulls the Earth towards the Sun; without it the Earth would move off in a straight line.',
    orbit_mis_none: 'Without a force a body does not go round; it moves in a straight line.',
    orbit_mis_own: 'A body’s own pull cannot make it go round.',
    orbit_mis_mag: 'It is the pull of mass, not of a magnet.',

    q_nopull: 'If the Earth’s pull suddenly vanished, which way would the Moon go?',
    np_straight: 'Straight on, the way it was going',
    np_out: 'Straight away from the Earth',
    np_round: 'Round and round as before',
    np_fall: 'It would fall onto the Earth',
    nopull_why:
      '<b>Straight on, the way it was going</b>: without a force a moving body moves in a straight line with the same velocity (Newton’s first law).',
    np_mis_out: 'Nothing pushes it outwards; it just keeps going straight.',
    np_mis_round: 'Going round needs a pull.',
    np_mis_fall: 'Falling needs a pull too.',

    q_name: 'Which of these is called gravity (মাধ্যাকর্ষণ বল)?',
    n_earth_apple: 'The pull of the Earth on an apple',
    n_sun_earth: 'The pull of the Sun on the Earth',
    n_two_apples: 'The pull of two apples on each other',
    n_magnet: 'The pull of a magnet on iron',
    name_why: '<b>The pull of the Earth on an apple</b>: the Earth’s gravitational force acting on us and the things around us is called gravity.',
    name_mis_other: 'This is a gravitational force too, but not the Earth’s pull.',
    name_mis_magnet: 'A magnet’s pull is not gravitational at all.',

    q_weight: 'Why do we feel our weight?',
    w_pull: 'Because gravity pulls us down',
    w_air: 'Because the air presses down on us',
    w_spin: 'Because the Earth spins',
    w_sun: 'Because the Sun pulls us',
    weight_why: '<b>Gravity</b> keeps pulling us towards the Earth’s centre, that is down; that is why we feel our weight.',
    weight_mis: 'Weight is the Earth’s pull, nothing else.',

    q_pairs: 'Do two apples on a table attract each other?',
    p_yes_weak: 'Yes, but only very slightly',
    p_no_big: 'No, only big bodies pull',
    p_no_earth: 'No, only the Earth pulls',
    p_yes_move: 'Yes, so they roll together',
    pairs_why:
      '<b>Yes, but only very slightly</b>: any two bodies with mass pull each other; here the pull is only {f} N, so the apples do not move.',

    q_range: 'What is the range of the gravitational force?',
    r_air: 'Up to the top of the air',
    r_m: '{p} m',
    range_why: '<b>Infinite</b>: the further apart, the weaker the pull, but it never becomes zero; the Sun pulls the Earth from 15 crore km away.',
    range_mis_strong: '{p} m is the range of the strong nuclear force.',
    range_mis_weak: '{p} m is the range of the weak nuclear force.',
    range_mis_air: 'There is gravity in space too, or the Moon would not go round.',

    q_double: 'If the distance between two apples is doubled, what happens to the gravitational force between them?',
    d_less: 'Smaller, but some remains',
    d_zero: 'It becomes zero',
    d_same: 'It stays the same',
    d_more: 'It gets bigger',
    double_why: '<b>Smaller, but some remains</b>: at twice the distance the pull is a quarter ({a} to {b} N). The range is infinite.',

    q_count: 'Question {i} of {n}',
    q_score: 'Correct: {right}',
    q_hint: 'Look at the picture, think, then pick the right answer.',
    q_right: 'Correct!',
    q_wrong: 'Not quite.',
    q_next: 'Next question',
    q_finish: 'See result',
    q_result: '{right} of {total} correct',
    q_great: 'Excellent, all correct!',
    q_good: 'Well done!',
    q_try: 'Have another go.',
    q_again: 'Try again',
    q_locked: 'The picture cannot be changed during the test. Look at it and pick an answer.',
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
