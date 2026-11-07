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
    mis_cd_none: 'যে সারিতে মুক্ত ইলেকট্রন ছুটছে, সেটিই সুপরিবাহী।',
    mis_cd_both: 'একটি সারিতেই ইলেকট্রন ছুটছে।',
    mis_cd_other: 'ওই সারির ইলেকট্রন আটকে থাকে: সেটি অপরিবাহী, যেমন কাচ।',
    why_conduct: '<b>{row}</b>: সেখানে মুক্ত ইলেকট্রন পুরো পদার্থে ছোটাছুটি করে। অন্য সারির ইলেকট্রন নিজের পরমাণুতে আটকে থাকে।',
    row_none: 'কোনোটিই নয়',
    row_both: 'দুটিই',
    row_bottom: 'নিচের সারি',
    row_top: 'উপরের সারি',
    q_conduct: 'ছবির দুই সারির পদার্থের কোনটি বিদ্যুৎ সুপরিবাহী, যেমন তামা?',
    mis_in_one: 'ছবিতে দেখো: ভেতরের কক্ষপথে ওপরে একটি, নিচে একটি।',
    mis_in_all: 'এটি পরমাণুর সব ইলেকট্রন, তিন কক্ষপথ মিলিয়ে।',
    mis_in_eight: 'এটি পরের কক্ষপথের সংখ্যা।',
    why_inner: '<b>{a}টি</b>: ভেতরের কক্ষপথ দুটিতেই পূর্ণ; তারপর ইলেকট্রন পরের কক্ষপথে যায়।',
    q_inner: 'ছবির পরমাণুর একেবারে ভেতরের কক্ষপথে কয়টি ইলেকট্রন?',
    mis_un_pos: 'নিউট্রনের চার্জ নেই; ধনাত্মক চার্জ প্রোটনের।',
    c_un_pos: 'নিউট্রন (ধনাত্মক)',
    lbl_free: 'মুক্ত ইলেকট্রন',
    lbl_glass: 'কাচ: অপরিবাহী',
    lbl_metal: 'তামা: সুপরিবাহী',
    lbl_nucleus_q: 'নিউক্লিয়াস +{p}',
    rule_conduct: 'এ রকম পদার্থ <b>বিদ্যুৎ সুপরিবাহী</b>: সোনা, রুপা, তামা। মুক্ত ইলেকট্রন নেই যাদের, তারা <b>বিদ্যুৎ অপরিবাহী</b>: কাঠ, প্লাস্টিক, কাচ, রাবার।',
    out_conduct: 'তামায় <b>মুক্ত ইলেকট্রন</b> পুরো পদার্থে ছোটাছুটি করে; কাচের ইলেকট্রন নিজের পরমাণুতে আটকে থাকে।',
    out_less_3: '{sum}: <b>তিনটি পজিটিভ চার্জ</b>, +{q}&nbsp;C।',
    out_less_2: '{sum}: <b>দুটি পজিটিভ চার্জ</b>, +{q}&nbsp;C।',
    out_less_1: '{sum}: <b>একটি পজিটিভ চার্জ</b>, +{q}&nbsp;C।',
    lead_conduct: 'যেকোনো সারিতে টোকা দিলে ইলেকট্রন আবার চলে। এবার নিজে যাচাই করো।',
    lead_less_max: 'সরানো {k}/{n}। সরানো ইলেকট্রনে টোকা দিলে ফিরে আসে; বা লবণের ক্লোরিনে চলো।',
    lead_less_0: 'বাইরের কক্ষপথের একটি ইলেকট্রনে টোকা দিয়ে সরাও (সরানো {k}/{n}), বা লবণের ক্লোরিনে চলো।',
    act_conduct: 'পরিবাহী দেখো',
    act_cl: 'ক্লোরিনে চলো',
    ex_conduct: 'পরিবাহী',
    howto_tap_row: 'সারিতে টোকা দাও',
    lbl_joined: 'যুক্ত হওয়া ইলেকট্রন',
    note_model: 'মডেল: মাপ ও কক্ষপথ প্রকৃত নয়',

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
    ex_less: 'কমলে',
    ex_more: 'বাড়লে',

    // the action and the quiet buttons
    act_look: 'নিউক্লিয়াস দেখো',
    act_fill: 'ইলেকট্রন বসাও',
    act_remove: 'একটি ইলেকট্রন সরাও',
    act_quiz: 'পরীক্ষা দাও',
    act_wait: 'দেখো…',
    act_home: 'আবার শুরু',

    // the first screen: a few calm words
    intro: 'চিরুনিতে কাগজের টুকরা লেগে যাওয়া, বজ্রপাত, সবকিছুর মূলে আছে চার্জ বা আধান। সামনে একটি আরগন পরমাণুর মডেল। চলো দেখি, পরমাণুর ভেতরে চার্জ কোথায় থাকে।',
    intro_short: 'সামনে একটি আরগন পরমাণুর মডেল। চলো দেখি, এর ভেতরে চার্জ কোথায় থাকে।',

    // the line before the action: what the next tap will show
    lead_nucleus: 'এবার নিউক্লিয়াসের বাইরে, কক্ষপথে ইলেকট্রন বসাই।',
    lead_shells: 'বাইরের একটি ইলেকট্রন সরালে কী হয়? গোল দাগের ইলেকট্রনে টোকা দাও।',
    lead_less: 'আরও একটি বাইরের ইলেকট্রনে টোকা দাও (সরানো {k}/{n}), বা লবণের ক্লোরিনে চলো।',
    lead_more: 'বিচ্ছিন্ন ইলেকট্রনে টোকা দিয়ে আবার সরাও বা বসাও, তারপর পরিবাহী দেখো।',

    // the result line
    out_nucleus: 'আরগনের নিউক্লিয়াসে <b>{p}টি প্রোটন</b> (+) আর {n}টি নিউট্রন (চার্জ নেই)।',
    out_shells: '{sum}। ইলেকট্রন বসল {a}, {b}, {c} করে।',
    out_less_0: '{sum}: মোট চার্জ আবার শূন্য।',
    out_more: '{sum}: <b>একটি নেগেটিভ চার্জ</b>, −{q}&nbsp;C।',
    out_more_0: '{sum}: ক্লোরিন এখন নিস্তড়িৎ।',

    // the rule: the book's words, the term in bold
    rule_nucleus: 'নিউক্লিয়াস তৈরি হয় প্রোটন আর নিউট্রন দিয়ে। প্রোটনের চার্জ <b>ধনাত্মক বা পজিটিভ</b>, নিউট্রনের কোনো চার্জ নেই।',
    rule_shells: 'ইলেকট্রনের চার্জ ঋণাত্মক, প্রোটনের সমান কিন্তু বিপরীত ({q}&nbsp;কুলম্ব, C)। সংখ্যায় সমান, তাই পরমাণু <b>বিদ্যুৎ নিরপেক্ষ বা নিস্তড়িৎ</b>।',
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

    q_unsigned: 'নিউক্লিয়াসে যে কণাগুলোর গায়ে কোনো চিহ্ন নেই, সেগুলো কী?',
    c_un_right: 'নিউট্রন (চার্জ নেই)',
    c_un_proton: 'প্রোটন (ধনাত্মক)',
    c_un_electron: 'ইলেকট্রন (ঋণাত্মক)',
    why_unsigned: '<b>নিউট্রন (চার্জ নেই)</b>: তাই কোনো চিহ্ন নেই। লাল কণাগুলো প্রোটন (+)।',
    mis_un_proton: 'প্রোটনের গায়ে + চিহ্ন আছে।',
    mis_un_electron: 'ইলেকট্রন নিউক্লিয়াসের বাইরে, কক্ষপথে থাকে।',

    q_move: 'ছবির পরমাণুটি আহিত হয়েছে। কোন কণাটি সরে গেছে?',
    c_mv_right: 'বাইরের কক্ষপথের একটি ইলেকট্রন',
    c_mv_proton: 'নিউক্লিয়াসের একটি প্রোটন',
    c_mv_neutron: 'নিউক্লিয়াসের একটি নিউট্রন',
    c_mv_inner: 'ভেতরের কক্ষপথের একটি ইলেকট্রন',
    why_move: '<b>বাইরের কক্ষপথের একটি ইলেকট্রন</b>: ছবিতে সেটি বাইরে, তার জায়গা ফাঁকা। একটু চেষ্টায় (যেমন ঘর্ষণে) এদের আলাদা করা যায়।',
    mis_mv_proton: 'প্রোটন নিউক্লিয়াসেই থাকে; সরে ইলেকট্রন।',
    mis_mv_neutron: 'নিউট্রনের চার্জ নেই; সরলেও পরমাণু আহিত হতো না।',
    mis_mv_inner: 'ভেতরের কক্ষপথ পূর্ণ; ফাঁকা জায়গাটি বাইরের কক্ষপথে।',

    q_removed: 'ছবির নিস্তড়িৎ আরগন পরমাণু থেকে কয়েকটি ইলেকট্রন সরানো হলো। এখন পরমাণুর মোট চার্জ কত?',
    why_removed: '<b>{v}</b>: প্রোটন {p}টি, ইলেকট্রন {e}টি; {p} − {e} = {k}।',
    mis_rm_flip: 'ইলেকট্রন কমলে − চার্জ কমে, তাই + চার্জ বেশি থাকে।',
    mis_rm_zero: 'প্রোটন আর ইলেকট্রন এখন আর সমান নয়।',
    mis_rm_protons: 'শুধু প্রোটন নয়, ইলেকট্রনের − চার্জও গুনতে হবে।',

    q_extra: 'ছবির নিস্তড়িৎ ক্লোরিন পরমাণুর বাইরে যে ইলেকট্রন অপেক্ষা করছে, সেটি খালি জায়গায় যুক্ত হলে মোট চার্জ কত কুলম্ব (C) হবে?',
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
    mis_cd_none: 'The row where free electrons run is the conductor.',
    mis_cd_both: 'Electrons run in one row only.',
    mis_cd_other: 'That row’s electrons stay put: an insulator, like glass.',
    why_conduct: '<b>{row}</b>: there free electrons run through the whole piece. In the other row each electron stays on its atom.',
    row_none: 'Neither',
    row_both: 'Both',
    row_bottom: 'The bottom row',
    row_top: 'The top row',
    q_conduct: 'Which row of matter in the picture is a good conductor, like copper?',
    mis_in_one: 'Look again: one at the top of the inner orbit, one at the bottom.',
    mis_in_all: 'That is all the atom’s electrons, on three orbits.',
    mis_in_eight: 'That is the next orbit’s number.',
    why_inner: '<b>{a}</b>: two fill the inner orbit; then electrons go to the next one.',
    q_inner: 'How many electrons are on the innermost orbit of the atom in the picture?',
    mis_un_pos: 'Neutrons have no charge; the positive charge is the protons’.',
    c_un_pos: 'Neutrons (positive)',
    lbl_free: 'free electron',
    lbl_glass: 'glass: insulator',
    lbl_metal: 'copper: conductor',
    lbl_nucleus_q: 'nucleus +{p}',
    rule_conduct:
      'Such matter is a <b>good conductor</b>: gold, silver, copper. Matter with no free electrons is an <b>insulator</b>: wood, plastic, glass, rubber.',
    out_conduct: 'In copper <b>free electrons</b> run through the whole piece; in glass every electron stays on its own atom.',
    out_less_3: '{sum}: <b>three positive charges</b>, +{q}&nbsp;C.',
    out_less_2: '{sum}: <b>two positive charges</b>, +{q}&nbsp;C.',
    out_less_1: '{sum}: <b>one positive charge</b>, +{q}&nbsp;C.',
    lead_conduct: 'Tap a row and the electrons run again. Now check yourself.',
    lead_less_max: 'Taken {k}/{n}. Tap a taken electron to bring it back, or go on to chlorine, as in salt.',
    lead_less_0: 'Tap an outer electron to take it away (taken {k}/{n}), or go on to chlorine, as in salt.',
    act_conduct: 'See conductors',
    act_cl: 'On to chlorine',
    ex_conduct: 'Conductors',
    howto_tap_row: 'Tap a row',
    lbl_joined: 'joined',
    note_model: 'A model: sizes and orbits not real',

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
    act_quiz: 'Take the test',
    act_wait: 'Watch…',
    act_home: 'Start again',

    intro:
      'Paper sticking to a comb, lightning: behind them all is electric charge. In front of you is a model of an argon atom. Let’s see where the charge is inside an atom.',
    intro_short: 'A model of an argon atom. Let’s see where the charge is inside it.',

    lead_nucleus: 'Now, outside the nucleus: let’s put the electrons on their orbits.',
    lead_shells: 'What if one outer electron is taken away? Tap the ringed electron.',
    lead_less: 'Tap one more outer electron (taken {k}/{n}), or go on to chlorine, as in salt.',
    lead_more: 'Tap the stray electron to take it out or put it back, then see conductors.',

    out_nucleus: 'The argon nucleus has <b>{p} protons</b> (+) and {n} neutrons (no charge).',
    out_shells: '{sum}. The electrons sit {a}, {b}, {c}.',
    out_less_0: '{sum}: the total charge is zero again.',
    out_more: '{sum}: <b>one negative charge</b>, −{q}&nbsp;C.',
    out_more_0: '{sum}: chlorine is neutral now.',

    rule_nucleus: 'The nucleus is made of protons and neutrons. A proton’s charge is <b>positive</b>; a neutron has no charge.',
    rule_shells:
      'An electron’s charge is negative, equal and opposite to a proton’s ({q}&nbsp;coulomb, C). Equal numbers: the atom is <b>neutral</b>.',
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

    q_unsigned: 'In the nucleus, what are the particles with no sign on them?',
    c_un_right: 'Neutrons (no charge)',
    c_un_proton: 'Protons (positive)',
    c_un_electron: 'Electrons (negative)',
    why_unsigned: '<b>Neutrons (no charge)</b>: so no sign. The red particles are protons (+).',
    mis_un_proton: 'Protons carry the + sign.',
    mis_un_electron: 'Electrons are outside the nucleus, on the orbits.',

    q_move: 'The atom in the picture has become charged. Which particle has gone?',
    c_mv_right: 'An electron of the outer orbit',
    c_mv_proton: 'A proton of the nucleus',
    c_mv_neutron: 'A neutron of the nucleus',
    c_mv_inner: 'An electron of an inner orbit',
    why_move: '<b>An electron of the outer orbit</b>: it waits outside, its place empty. Rubbing can separate them.',
    mis_mv_proton: 'Protons stay in the nucleus; electrons move.',
    mis_mv_neutron: 'Neutrons have no charge; losing one would not charge the atom.',
    mis_mv_inner: 'The inner orbits are full; the empty place is on the outer one.',

    q_removed: 'Electrons were taken from this neutral argon atom. What is its total charge now?',
    why_removed: '<b>{v}</b>: {p} protons, {e} electrons; {p} − {e} = {k}.',
    mis_rm_flip: 'Fewer electrons means less − charge, so + is left over.',
    mis_rm_zero: 'Protons and electrons are no longer equal.',
    mis_rm_protons: 'Count the electrons’ − charge too, not only the protons.',

    q_extra: 'The waiting electron joins this neutral chlorine atom’s empty place. What will the total charge be in coulombs (C)?',
    why_extra: '<b>{v}</b>: one electron too many.',
    mis_ex_flip: 'An extra electron makes the charge negative.',
    mis_ex_one: 'One electron’s charge is far smaller than {one} C.',
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
